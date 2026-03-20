const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://sponto-production.up.railway.app';

async function request(path: string, options?: RequestInit & { timeoutMs?: number }) {
  const url = `${BACKEND_URL}/api${path}`;

  // Default 15s timeout, but allow longer for image-heavy requests
  const timeout = options?.timeoutMs || 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Remove custom property before passing to fetch
  const { timeoutMs, ...fetchOptions } = options || {};

  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(fetchOptions?.headers as any) },
      ...fetchOptions,
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API Error ${res.status}: ${text}`);
    }
    return res.json();
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  getDashboard: () => request('/dashboard'),
  getItems: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/items${qs}`);
  },
  getItem: (id: string) => request(`/items/${id}`),
  createItem: (data: any) => request('/items', {
    method: 'POST',
    body: JSON.stringify(data),
    timeoutMs: 60000, // 60s — payload includes base64 photos
  }),
  updateItem: (id: string, data: any) => request(`/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    timeoutMs: 60000,
  }),
  deleteItem: (id: string) => request(`/items/${id}`, { method: 'DELETE' }),
  // Bulk operations
  bulkUpdateItems: (itemIds: string[], update: Record<string, any>) =>
    request('/items/bulk-update', { method: 'POST', body: JSON.stringify({ item_ids: itemIds, update }) }),
  bulkDeleteItems: (itemIds: string[]) =>
    request('/items/bulk-delete', { method: 'POST', body: JSON.stringify({ item_ids: itemIds }) }),
  getPipeline: () => request('/pipeline'),
  getDeadstock: () => request('/deadstock'),
  getInsights: () => request('/insights'),
  getSettings: () => request('/settings'),
  updateSettings: (data: any) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  sourceCalculate: (data: any) => request('/source/calculate', { method: 'POST', body: JSON.stringify(data) }),
  analyzeScreenshot: (images: string[]) => request('/analyze-screenshot', {
    method: 'POST',
    body: JSON.stringify({ images }),
    timeoutMs: 45000, // 45s — Claude Vision analysis takes time
  }),
  seed: () => request('/seed', { method: 'POST' }),
  resetData: () => request('/reset', { method: 'POST' }),
};
