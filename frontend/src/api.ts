const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

async function request(path: string, options?: RequestInit) {
  const url = `${BACKEND_URL}/api${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers as any) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error ${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  getDashboard: () => request('/dashboard'),
  getItems: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/items${qs}`);
  },
  getItem: (id: string) => request(`/items/${id}`),
  createItem: (data: any) => request('/items', { method: 'POST', body: JSON.stringify(data) }),
  updateItem: (id: string, data: any) => request(`/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
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
  analyzeScreenshot: (images: string[]) => request('/analyze-screenshot', { method: 'POST', body: JSON.stringify({ images }) }),
  seed: () => request('/seed', { method: 'POST' }),
  resetData: () => request('/reset', { method: 'POST' }),
};
