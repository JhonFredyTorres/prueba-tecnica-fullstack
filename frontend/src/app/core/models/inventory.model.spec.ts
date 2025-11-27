import { getStockStatus, getStockStatusLabel, StockStatus } from './inventory.model';

describe('Inventory Model Functions', () => {
  
  describe('getStockStatus()', () => {
    it('should return "out_of_stock" when quantity is 0', () => {
      expect(getStockStatus(0, 10)).toBe('out_of_stock');
      expect(getStockStatus(0, 5)).toBe('out_of_stock');
      expect(getStockStatus(0, 0)).toBe('out_of_stock');
    });

    it('should return "low" when quantity equals minStock', () => {
      expect(getStockStatus(10, 10)).toBe('low');
      expect(getStockStatus(5, 5)).toBe('low');
      expect(getStockStatus(1, 1)).toBe('low');
    });

    it('should return "low" when quantity is less than minStock but greater than 0', () => {
      expect(getStockStatus(5, 10)).toBe('low');
      expect(getStockStatus(3, 5)).toBe('low');
      expect(getStockStatus(1, 100)).toBe('low');
    });

    it('should return "available" when quantity is greater than minStock', () => {
      expect(getStockStatus(100, 10)).toBe('available');
      expect(getStockStatus(11, 10)).toBe('available');
      expect(getStockStatus(50, 5)).toBe('available');
    });

    it('should handle edge cases', () => {
      // Very large numbers
      expect(getStockStatus(1000000, 100)).toBe('available');
      
      // One more than minStock
      expect(getStockStatus(11, 10)).toBe('available');
      
      // Exactly at threshold
      expect(getStockStatus(10, 10)).toBe('low');
    });
  });

  describe('getStockStatusLabel()', () => {
    it('should return "Disponible" for available status', () => {
      expect(getStockStatusLabel('available')).toBe('Disponible');
    });

    it('should return "Stock Bajo" for low status', () => {
      expect(getStockStatusLabel('low')).toBe('Stock Bajo');
    });

    it('should return "Sin Stock" for out_of_stock status', () => {
      expect(getStockStatusLabel('out_of_stock')).toBe('Sin Stock');
    });

    it('should return correct labels for all status types', () => {
      const statuses: StockStatus[] = ['available', 'low', 'out_of_stock'];
      const expectedLabels = ['Disponible', 'Stock Bajo', 'Sin Stock'];

      statuses.forEach((status, index) => {
        expect(getStockStatusLabel(status)).toBe(expectedLabels[index]);
      });
    });
  });

  describe('Integration: getStockStatus + getStockStatusLabel', () => {
    it('should work together for out of stock scenario', () => {
      const status = getStockStatus(0, 10);
      const label = getStockStatusLabel(status);
      expect(label).toBe('Sin Stock');
    });

    it('should work together for low stock scenario', () => {
      const status = getStockStatus(5, 10);
      const label = getStockStatusLabel(status);
      expect(label).toBe('Stock Bajo');
    });

    it('should work together for available stock scenario', () => {
      const status = getStockStatus(100, 10);
      const label = getStockStatusLabel(status);
      expect(label).toBe('Disponible');
    });
  });
});