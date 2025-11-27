// Producto para uso en frontend
export interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  category: string;
  sku: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductRequest {
  name: string;
  description?: string | null;
  price: number;
  category: string;
  sku: string;
}

// JSON:API structures
export interface ProductAttributes {
  name: string;
  description?: string | null;
  price: number;
  category: string;
  sku: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductData {
  type: string;
  id: string;
  attributes: ProductAttributes;
}

export interface ProductResponse {
  data: ProductData;
}

export interface ProductListResponse {
  data: ProductData[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

export interface PaginationMeta {
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface PaginationLinks {
  self: string;
  first: string;
  last: string;
  prev?: string;
  next?: string;
}

export interface ProductSearchParams {
  page?: number;
  size?: number;
  category?: string;
  active?: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export const PRODUCT_CATEGORIES = [
  'Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books',
  'Toys', 'Food & Beverages', 'Health & Beauty', 'Automotive', 'Other'
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];