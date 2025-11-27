import { isApiError, getErrorMessage, ApiErrorResponse, ApiError } from './api.model';

describe('API Model Functions', () => {
  
  describe('isApiError()', () => {
    it('should return true for valid ApiErrorResponse', () => {
      const validError: ApiErrorResponse = {
        errors: [
          {
            status: '404',
            code: 'PRODUCT_NOT_FOUND',
            title: 'Not Found',
            detail: 'Product not found'
          }
        ]
      };
      expect(isApiError(validError)).toBeTrue();
    });

    it('should return true for ApiErrorResponse with multiple errors', () => {
      const validError: ApiErrorResponse = {
        errors: [
          { status: '400', code: 'VALIDATION_ERROR', title: 'Bad Request', detail: 'Name is required' },
          { status: '400', code: 'VALIDATION_ERROR', title: 'Bad Request', detail: 'SKU is required' }
        ]
      };
      expect(isApiError(validError)).toBeTrue();
    });

    it('should return true for ApiErrorResponse with empty errors array', () => {
      const validError: ApiErrorResponse = {
        errors: []
      };
      expect(isApiError(validError)).toBeTrue();
    });

    it('should return false for null', () => {
      expect(isApiError(null)).toBeFalse();
    });

    it('should return false for undefined', () => {
      expect(isApiError(undefined)).toBeFalse();
    });

    it('should return false for primitive types', () => {
      expect(isApiError('string')).toBeFalse();
      expect(isApiError(123)).toBeFalse();
      expect(isApiError(true)).toBeFalse();
    });

    it('should return false for object without errors property', () => {
      expect(isApiError({ data: [] })).toBeFalse();
      expect(isApiError({ message: 'error' })).toBeFalse();
      expect(isApiError({})).toBeFalse();
    });

    it('should return false for object with non-array errors property', () => {
      expect(isApiError({ errors: 'not an array' })).toBeFalse();
      expect(isApiError({ errors: 123 })).toBeFalse();
      expect(isApiError({ errors: {} })).toBeFalse();
      expect(isApiError({ errors: null })).toBeFalse();
    });

    it('should return true for errors array even with unexpected content', () => {
      // The function only checks if errors is an array, not its contents
      const weirdError = {
        errors: [1, 2, 3]
      };
      expect(isApiError(weirdError)).toBeTrue();
    });
  });

  describe('getErrorMessage()', () => {
    it('should return correct message for PRODUCT_NOT_FOUND', () => {
      expect(getErrorMessage('PRODUCT_NOT_FOUND')).toBe('El producto no fue encontrado.');
    });

    it('should return correct message for DUPLICATE_SKU', () => {
      expect(getErrorMessage('DUPLICATE_SKU')).toBe('Ya existe un producto con ese código SKU.');
    });

    it('should return correct message for INVENTORY_NOT_FOUND', () => {
      expect(getErrorMessage('INVENTORY_NOT_FOUND')).toBe('No existe inventario para este producto.');
    });

    it('should return correct message for INSUFFICIENT_STOCK', () => {
      expect(getErrorMessage('INSUFFICIENT_STOCK')).toBe('No hay suficiente stock disponible.');
    });

    it('should return correct message for VALIDATION_ERROR', () => {
      expect(getErrorMessage('VALIDATION_ERROR')).toBe('Los datos enviados no son válidos.');
    });

    it('should return correct message for UNAUTHORIZED', () => {
      expect(getErrorMessage('UNAUTHORIZED')).toBe('No tienes autorización para esta acción.');
    });

    it('should return default message for unknown error codes', () => {
      expect(getErrorMessage('UNKNOWN_ERROR')).toBe('Ocurrió un error inesperado.');
      expect(getErrorMessage('SOMETHING_ELSE')).toBe('Ocurrió un error inesperado.');
      expect(getErrorMessage('')).toBe('Ocurrió un error inesperado.');
    });

    it('should handle case sensitivity', () => {
      // Error codes should be exact match
      expect(getErrorMessage('product_not_found')).toBe('Ocurrió un error inesperado.');
      expect(getErrorMessage('Product_Not_Found')).toBe('Ocurrió un error inesperado.');
    });
  });

  describe('All known error codes', () => {
    const knownCodes = [
      'PRODUCT_NOT_FOUND',
      'DUPLICATE_SKU',
      'INVENTORY_NOT_FOUND',
      'INSUFFICIENT_STOCK',
      'VALIDATION_ERROR',
      'UNAUTHORIZED'
    ];

    it('should have a specific message for each known code', () => {
      knownCodes.forEach(code => {
        const message = getErrorMessage(code);
        expect(message).not.toBe('Ocurrió un error inesperado.');
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });
});