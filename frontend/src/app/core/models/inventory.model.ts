export interface Inventory {
  id: number;
  productId: number;
  quantity: number;
  reservedQuantity: number;
  minStock: number;
  availableQuantity: number;
  lowStock: boolean;
  product?: InventoryProductInfo;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryProductInfo {
  id: number;
  name: string;
  sku: string;
  category: string;
}

export interface InventoryRequest {
  productId: number;
  quantity: number;
  minStock?: number;
}

export interface PurchaseRequest {
  quantity: number;
}

// JSON:API structures
export interface InventoryAttributes {
  productId: number;
  quantity: number;
  reservedQuantity: number;
  minStock: number;
  availableQuantity: number;
  lowStock: boolean;
  product?: InventoryProductInfo;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryData {
  type: string;
  id: string;
  attributes: InventoryAttributes;
}

export interface InventoryResponse {
  data: InventoryData;
}

export interface InventoryListResponse {
  data: InventoryData[];
  meta?: { totalElements: number; totalPages: number; currentPage: number; pageSize: number; };
}

export type StockStatus = 'available' | 'low' | 'out_of_stock';

export function getStockStatus(quantity: number, minStock: number): StockStatus {
  if (quantity === 0) return 'out_of_stock';
  if (quantity <= minStock) return 'low';
  return 'available';
}

export function getStockStatusLabel(status: StockStatus): string {
  const labels: Record<StockStatus, string> = {
    'available': 'Disponible',
    'low': 'Stock Bajo',
    'out_of_stock': 'Sin Stock'
  };
  return labels[status];
}