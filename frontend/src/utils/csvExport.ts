import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

interface ExportOptions {
  filename: string;
  data: any[];
  columns: Array<{
    key: string;
    header: string;
    formatter?: (value: any) => string;
  }>;
}

// Convert data to CSV string
function toCSV(data: any[], columns: ExportOptions['columns']): string {
  // Header row
  const headers = columns.map(col => `"${col.header}"`).join(',');
  
  // Data rows
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key];
      
      // Apply formatter if provided
      if (col.formatter && value !== undefined && value !== null) {
        value = col.formatter(value);
      }
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        value = '';
      }
      
      // Convert arrays to comma-separated string
      if (Array.isArray(value)) {
        value = value.join('; ');
      }
      
      // Escape quotes and wrap in quotes
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
  });
  
  return [headers, ...rows].join('\n');
}

// Export data as CSV
export async function exportToCSV({ filename, data, columns }: ExportOptions): Promise<boolean> {
  try {
    const csvContent = toCSV(data, columns);
    const timestamp = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}_${timestamp}.csv`;
    
    if (Platform.OS === 'web') {
      // Web: Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fullFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } else {
      // Mobile: Write to file and share
      const fileUri = `${FileSystem.documentDirectory}${fullFilename}`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      // Check if sharing is available
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: `Export ${filename}`,
          UTI: 'public.comma-separated-values-text',
        });
        return true;
      } else {
        console.log('Sharing not available on this device');
        return false;
      }
    }
  } catch (error) {
    console.error('Export error:', error);
    return false;
  }
}

// Pre-defined export configurations
export const INVENTORY_COLUMNS = [
  { key: 'title', header: 'Title' },
  { key: 'brand', header: 'Brand' },
  { key: 'category', header: 'Category' },
  { key: 'size', header: 'Size' },
  { key: 'condition', header: 'Condition' },
  { key: 'status', header: 'Status' },
  { key: 'purchase_price', header: 'Purchase Price', formatter: (v: number) => v?.toFixed(2) || '0.00' },
  { key: 'listed_price', header: 'Listed Price', formatter: (v: number) => v?.toFixed(2) || '0.00' },
  { key: 'sold_price', header: 'Sold Price', formatter: (v: number) => v?.toFixed(2) || '' },
  { key: 'net_profit', header: 'Net Profit', formatter: (v: number) => v?.toFixed(2) || '' },
  { key: 'platforms', header: 'Platforms' },
  { key: 'date_acquired', header: 'Date Acquired' },
  { key: 'date_listed', header: 'Date Listed' },
  { key: 'date_sold', header: 'Date Sold' },
  { key: 'days_listed', header: 'Days Listed' },
  { key: 'days_to_sell', header: 'Days to Sell' },
  { key: 'tags', header: 'Tags' },
  { key: 'notes', header: 'Notes' },
];

export const SALES_COLUMNS = [
  { key: 'title', header: 'Title' },
  { key: 'brand', header: 'Brand' },
  { key: 'category', header: 'Category' },
  { key: 'platforms', header: 'Platform Sold On' },
  { key: 'purchase_price', header: 'Purchase Price', formatter: (v: number) => v?.toFixed(2) || '0.00' },
  { key: 'sold_price', header: 'Sold Price', formatter: (v: number) => v?.toFixed(2) || '0.00' },
  { key: 'fees', header: 'Fees', formatter: (v: number) => v?.toFixed(2) || '0.00' },
  { key: 'shipping_cost', header: 'Shipping Cost', formatter: (v: number) => v?.toFixed(2) || '0.00' },
  { key: 'net_profit', header: 'Net Profit', formatter: (v: number) => v?.toFixed(2) || '0.00' },
  { key: 'roi', header: 'ROI %', formatter: (v: number) => v ? `${v.toFixed(1)}%` : '' },
  { key: 'date_acquired', header: 'Date Acquired' },
  { key: 'date_sold', header: 'Date Sold' },
  { key: 'days_to_sell', header: 'Days to Sell' },
];

export const SUMMARY_COLUMNS = [
  { key: 'metric', header: 'Metric' },
  { key: 'value', header: 'Value' },
];
