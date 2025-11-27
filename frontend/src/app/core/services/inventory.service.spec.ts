import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { InventoryService } from './inventory.service';
import { InventoryResponse, InventoryListResponse } from '../models';
import { environment } from '@env/environment';

describe('InventoryService', () => {
  let service: InventoryService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrls.inventory;

  // Mock data
  const mockInventoryData = {
    id: '1',
    type: 'inventory',
    attributes: {
      productId: 1,
      quantity: 100,
      reservedQuantity: 0,
      minStock: 10,
      availableQuantity: 100,
      lowStock: false,
      product: {
        id: 1,
        name: 'Test Product',
        sku: 'TEST-001',
        category: 'Electronics'
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  };

  const mockInventoryResponse: InventoryResponse = {
    data: mockInventoryData
  };

  const mockLowStockData = {
    id: '2',
    type: 'inventory',
    attributes: {
      productId: 2,
      quantity: 5,
      reservedQuantity: 0,
      minStock: 10,
      availableQuantity: 5,
      lowStock: true,
      product: {
        id: 2,
        name: 'Low Stock Product',
        sku: 'LOW-001',
        category: 'Electronics'
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [InventoryService]
    });

    service = TestBed.inject(InventoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should start with null inventory', () => {
      expect(service.inventory()).toBeNull();
    });

    it('should start with empty low stock items', () => {
      expect(service.lowStockItems()).toEqual([]);
    });

    it('should start with loading false', () => {
      expect(service.loading()).toBeFalse();
    });

    it('should start with null stock status', () => {
      expect(service.stockStatus()).toBeNull();
    });

    it('should start with lowStockCount 0', () => {
      expect(service.lowStockCount()).toBe(0);
    });
  });

  describe('getInventoryByProductId()', () => {
    it('should fetch inventory for a product', () => {
      service.getInventoryByProductId(1).subscribe(inventory => {
        expect(inventory.productId).toBe(1);
        expect(inventory.quantity).toBe(100);
        expect(service.inventory()).toEqual(inventory);
      });

      const req = httpMock.expectOne(`${apiUrl}/inventory/product/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockInventoryResponse);
    });

    it('should set loading state correctly', () => {
      service.getInventoryByProductId(1).subscribe();
      expect(service.loading()).toBeTrue();

      const req = httpMock.expectOne(`${apiUrl}/inventory/product/1`);
      req.flush(mockInventoryResponse);
      expect(service.loading()).toBeFalse();
    });

    it('should update stock status computed signal', () => {
      service.getInventoryByProductId(1).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/inventory/product/1`);
      req.flush(mockInventoryResponse);

      expect(service.stockStatus()).toBe('available');
    });
  });

  describe('createOrUpdateInventory()', () => {
    const createRequest = {
      productId: 1,
      quantity: 50,
      minStock: 5
    };

    it('should create or update inventory', () => {
      service.createOrUpdateInventory(createRequest).subscribe(inventory => {
        expect(inventory.productId).toBe(1);
        expect(service.inventory()).toEqual(inventory);
      });

      const req = httpMock.expectOne(`${apiUrl}/inventory`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush(mockInventoryResponse);
    });

    it('should set loading state correctly', () => {
      service.createOrUpdateInventory(createRequest).subscribe();
      expect(service.loading()).toBeTrue();

      const req = httpMock.expectOne(`${apiUrl}/inventory`);
      req.flush(mockInventoryResponse);
      expect(service.loading()).toBeFalse();
    });
  });

  describe('updateQuantity()', () => {
    it('should update inventory quantity', () => {
      service.updateQuantity(1, 150).subscribe(inventory => {
        expect(inventory.productId).toBe(1);
        expect(service.inventory()).toEqual(inventory);
      });

      const req = httpMock.expectOne(`${apiUrl}/inventory/product/1/quantity?quantity=150`);
      expect(req.request.method).toBe('PATCH');
      req.flush(mockInventoryResponse);
    });

    it('should include quantity as query parameter', () => {
      service.updateQuantity(1, 200).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/inventory/product/1/quantity?quantity=200`);
      expect(req.request.method).toBe('PATCH');
      req.flush(mockInventoryResponse);
    });
  });

  describe('processPurchase()', () => {
    const purchaseRequest = { quantity: 10 };

    it('should process a purchase', () => {
      const purchaseResponse: InventoryResponse = {
        data: {
          ...mockInventoryData,
          attributes: {
            ...mockInventoryData.attributes,
            quantity: 90,
            availableQuantity: 90
          }
        }
      };

      service.processPurchase(1, purchaseRequest).subscribe(inventory => {
        expect(inventory.quantity).toBe(90);
        expect(service.inventory()).toEqual(inventory);
      });

      const req = httpMock.expectOne(`${apiUrl}/inventory/product/1/purchase`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(purchaseRequest);
      req.flush(purchaseResponse);
    });

    it('should set loading state correctly', () => {
      service.processPurchase(1, purchaseRequest).subscribe();
      expect(service.loading()).toBeTrue();

      const req = httpMock.expectOne(`${apiUrl}/inventory/product/1/purchase`);
      req.flush(mockInventoryResponse);
      expect(service.loading()).toBeFalse();
    });
  });

  describe('checkStock()', () => {
    it('should check if stock is available', () => {
      service.checkStock(1, 10).subscribe(isAvailable => {
        expect(isAvailable).toBeTrue();
      });

      const req = httpMock.expectOne(`${apiUrl}/inventory/product/1/check-stock?quantity=10`);
      expect(req.request.method).toBe('GET');
      req.flush(true);
    });

    it('should return false when stock is insufficient', () => {
      service.checkStock(1, 1000).subscribe(isAvailable => {
        expect(isAvailable).toBeFalse();
      });

      const req = httpMock.expectOne(`${apiUrl}/inventory/product/1/check-stock?quantity=1000`);
      req.flush(false);
    });
  });

  describe('getLowStockItems()', () => {
    it('should fetch items with low stock', () => {
      const lowStockResponse: InventoryListResponse = {
        data: [mockLowStockData],
        meta: {
          totalElements: 1,
          totalPages: 1,
          currentPage: 0,
          pageSize: 10
        }
      };

      service.getLowStockItems().subscribe(items => {
        expect(items.length).toBe(1);
        expect(items[0].lowStock).toBeTrue();
        expect(service.lowStockItems()).toEqual(items);
        expect(service.lowStockCount()).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/inventory/low-stock`);
      expect(req.request.method).toBe('GET');
      req.flush(lowStockResponse);
    });

    it('should handle empty low stock list', () => {
      const emptyResponse: InventoryListResponse = {
        data: [],
        meta: {
          totalElements: 0,
          totalPages: 0,
          currentPage: 0,
          pageSize: 10
        }
      };

      service.getLowStockItems().subscribe(items => {
        expect(items).toEqual([]);
        expect(service.lowStockCount()).toBe(0);
      });

      const req = httpMock.expectOne(`${apiUrl}/inventory/low-stock`);
      req.flush(emptyResponse);
    });

    it('should handle errors gracefully', () => {
      service.getLowStockItems().subscribe(items => {
        expect(items).toEqual([]);
        expect(service.lowStockItems()).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiUrl}/inventory/low-stock`);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('deleteInventory()', () => {
    it('should delete inventory for a product', () => {
      // First load inventory
      service.getInventoryByProductId(1).subscribe();
      const getReq = httpMock.expectOne(`${apiUrl}/inventory/product/1`);
      getReq.flush(mockInventoryResponse);

      expect(service.inventory()).not.toBeNull();

      service.deleteInventory(1).subscribe();
      const deleteReq = httpMock.expectOne(`${apiUrl}/inventory/product/1`);
      expect(deleteReq.request.method).toBe('DELETE');
      deleteReq.flush(null);

      expect(service.inventory()).toBeNull();
    });

    it('should set loading state correctly', () => {
      service.deleteInventory(1).subscribe();
      expect(service.loading()).toBeTrue();

      const req = httpMock.expectOne(`${apiUrl}/inventory/product/1`);
      req.flush(null);
      expect(service.loading()).toBeFalse();
    });
  });

  describe('clearInventory()', () => {
    it('should clear the inventory signal', () => {
      service.getInventoryByProductId(1).subscribe();
      const req = httpMock.expectOne(`${apiUrl}/inventory/product/1`);
      req.flush(mockInventoryResponse);

      expect(service.inventory()).not.toBeNull();

      service.clearInventory();
      expect(service.inventory()).toBeNull();
      expect(service.stockStatus()).toBeNull();
    });
  });

  describe('Stock Status Computed Signal', () => {
    it('should return "available" when quantity > minStock', () => {
      service.getInventoryByProductId(1).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/inventory/product/1`);
      req.flush(mockInventoryResponse); // quantity: 100, minStock: 10

      expect(service.stockStatus()).toBe('available');
    });

    it('should return "low" when quantity <= minStock and > 0', () => {
      const lowStockResponse: InventoryResponse = {
        data: mockLowStockData // quantity: 5, minStock: 10
      };

      service.getInventoryByProductId(2).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/inventory/product/2`);
      req.flush(lowStockResponse);

      expect(service.stockStatus()).toBe('low');
    });

    it('should return "out_of_stock" when quantity is 0', () => {
      const outOfStockResponse: InventoryResponse = {
        data: {
          ...mockInventoryData,
          attributes: {
            ...mockInventoryData.attributes,
            quantity: 0,
            availableQuantity: 0
          }
        }
      };

      service.getInventoryByProductId(1).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/inventory/product/1`);
      req.flush(outOfStockResponse);

      expect(service.stockStatus()).toBe('out_of_stock');
    });
  });
});