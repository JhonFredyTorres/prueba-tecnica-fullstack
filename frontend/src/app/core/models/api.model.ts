export interface ApiError {
  status: string;
  code: string;
  title: string;
  detail: string;
}

export interface ApiErrorResponse {
  errors: ApiError[];
}

export function isApiError(obj: unknown): obj is ApiErrorResponse {
  return typeof obj === 'object' && obj !== null && 'errors' in obj && 
    Array.isArray((obj as ApiErrorResponse).errors);
}

export function getErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'PRODUCT_NOT_FOUND': 'El producto no fue encontrado.',
    'DUPLICATE_SKU': 'Ya existe un producto con ese código SKU.',
    'INVENTORY_NOT_FOUND': 'No existe inventario para este producto.',
    'INSUFFICIENT_STOCK': 'No hay suficiente stock disponible.',
    'VALIDATION_ERROR': 'Los datos enviados no son válidos.',
    'UNAUTHORIZED': 'No tienes autorización para esta acción.'
  };
  return messages[code] || 'Ocurrió un error inesperado.';
}