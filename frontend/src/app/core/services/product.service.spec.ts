import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { ProductListResponse, ProductResponse, Product } from '../models';
import { environment } from '@env/environment';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrls.products;

  // Mock data
  const mockProductData = {
    id: '1',
    type: 'products',
    attributes: {
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      category: 'Electronics',
      sku: 'TEST-001',
      active: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  };

  const mockProductResponse: ProductResponse = {
    data: mockProductData
  };

  const mockProductListResponse: ProductListResponse = {
    data: [mockProductData],
    meta: {
      totalElements: 1,
      totalPages: 1,
      currentPage: 0,
      pageSize: 10
    },
    links: {
      self: '/api/v1/products?page=0&size=10',
      first: '/api/v1/products?page=0&size=10',
      last: '/api/v1/products?page=0&size=10'
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService]
    });

    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should start with empty products array', () => {
      expect(service.products()).toEqual([]);
    });

    it('should start with null selected product', () => {
      expect(service.selectedProduct()).toBeNull();
    });

    it('should start with loading false', () => {
      expect(service.loading()).toBeFalse();
    });

    it('should start with isEmpty true', () => {
      expect(service.isEmpty()).toBeTrue();
    });

    it('should start with totalProducts 0', () => {
      expect(service.totalProducts()).toBe(0);
    });
  });

  describe('getProducts()', () => {
    it('should fetch products list', () => {
      service.getProducts().subscribe(response => {
        expect(response).toEqual(mockProductListResponse);
        expect(service.products().length).toBe(1);
        expect(service.products()[0].name).toBe('Test Product');
      });

      const req = httpMock.expectOne(`${apiUrl}/products?page=0&size=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProductListResponse);
    });

    it('should set loading to true while fetching', () => {
      service.getProducts().subscribe();
      expect(service.loading()).toBeTrue();

      const req = httpMock.expectOne(`${apiUrl}/products?page=0&size=10`);
      req.flush(mockProductListResponse);
      expect(service.loading()).toBeFalse();
    });

    it('should update pagination signal', () => {
      service.getProducts().subscribe();

      const req = httpMock.expectOne(`${apiUrl}/products?page=0&size=10`);
      req.flush(mockProductListResponse);

      expect(service.pagination()).toEqual(mockProductListResponse.meta);
      expect(service.totalProducts()).toBe(1);
    });

    it('should handle pagination parameters', () => {
      service.getProducts({ page: 2, size: 20 }).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/products?page=2&size=20`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProductListResponse);
    });

    it('should handle category filter', () => {
      service.getProducts({ category: 'Electronics' }).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/products?page=0&size=10&category=Electronics`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProductListResponse);
    });

    it('should handle sorting parameters', () => {
      service.getProducts({ sortBy: 'price', sortDir: 'desc' }).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/products?page=0&size=10&sortBy=price&sortDir=desc`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProductListResponse);
    });

    it('should handle active filter', () => {
      service.getProducts({ active: true }).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/products?page=0&size=10&active=true`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProductListResponse);
    });
  });

  describe('getProductById()', () => {
    it('should fetch a product by id', () => {
      service.getProductById(1).subscribe(product => {
        expect(product.id).toBe(1);
        expect(product.name).toBe('Test Product');
        expect(service.selectedProduct()).toEqual(product);
      });

      const req = httpMock.expectOne(`${apiUrl}/products/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProductResponse);
    });

    it('should set loading state correctly', () => {
      service.getProductById(1).subscribe();
      expect(service.loading()).toBeTrue();

      const req = httpMock.expectOne(`${apiUrl}/products/1`);
      req.flush(mockProductResponse);
      expect(service.loading()).toBeFalse();
    });
  });

  describe('createProduct()', () => {
    const createRequest = {
      name: 'New Product',
      sku: 'NEW-001',
      price: 49.99,
      category: 'Electronics',
      description: 'New Description'
    };

    it('should create a new product', () => {
      service.createProduct(createRequest).subscribe(product => {
        expect(product.name).toBe('Test Product');
        expect(service.products().length).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/products`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush(mockProductResponse);
    });

    it('should add new product to the beginning of the list', () => {
      // First set some existing products
      service.getProducts().subscribe();
      const listReq = httpMock.expectOne(`${apiUrl}/products?page=0&size=10`);
      listReq.flush(mockProductListResponse);

      const newProductResponse: ProductResponse = {
        data: {
          id: '2',
          type: 'products',
          attributes: {
            name: 'Brand New Product',
            description: 'New Desc',
            price: 199.99,
            category: 'Electronics',
            sku: 'NEW-002',
            active: true,
            createdAt: '2024-01-02T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z'
          }
        }
      };

      service.createProduct(createRequest).subscribe();
      const createReq = httpMock.expectOne(`${apiUrl}/products`);
      createReq.flush(newProductResponse);

      expect(service.products().length).toBe(2);
      expect(service.products()[0].name).toBe('Brand New Product');
    });
  });

  describe('updateProduct()', () => {
    const updateRequest = {
      name: 'Updated Product',
      sku: 'TEST-001',
      price: 149.99,
      category: 'Electronics',
      description: 'Updated Description'
    };

    it('should update an existing product', () => {
      const updatedResponse: ProductResponse = {
        data: {
          ...mockProductData,
          attributes: {
            ...mockProductData.attributes,
            name: 'Updated Product',
            price: 149.99
          }
        }
      };

      service.updateProduct(1, updateRequest).subscribe(product => {
        expect(product.name).toBe('Updated Product');
        expect(product.price).toBe(149.99);
        expect(service.selectedProduct()).toEqual(product);
      });

      const req = httpMock.expectOne(`${apiUrl}/products/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(updatedResponse);
    });

    it('should update product in the products array', () => {
      // First load products
      service.getProducts().subscribe();
      const listReq = httpMock.expectOne(`${apiUrl}/products?page=0&size=10`);
      listReq.flush(mockProductListResponse);

      const updatedResponse: ProductResponse = {
        data: {
          ...mockProductData,
          attributes: {
            ...mockProductData.attributes,
            name: 'Updated Product'
          }
        }
      };

      service.updateProduct(1, updateRequest).subscribe();
      const updateReq = httpMock.expectOne(`${apiUrl}/products/1`);
      updateReq.flush(updatedResponse);

      expect(service.products()[0].name).toBe('Updated Product');
    });
  });

  describe('deleteProduct()', () => {
    it('should delete a product', () => {
      // First load products
      service.getProducts().subscribe();
      const listReq = httpMock.expectOne(`${apiUrl}/products?page=0&size=10`);
      listReq.flush(mockProductListResponse);

      expect(service.products().length).toBe(1);

      service.deleteProduct(1).subscribe();
      const deleteReq = httpMock.expectOne(`${apiUrl}/products/1`);
      expect(deleteReq.request.method).toBe('DELETE');
      deleteReq.flush(null);

      expect(service.products().length).toBe(0);
    });

    it('should clear selected product if it was deleted', () => {
      // Load and select product
      service.getProductById(1).subscribe();
      const getReq = httpMock.expectOne(`${apiUrl}/products/1`);
      getReq.flush(mockProductResponse);

      expect(service.selectedProduct()).not.toBeNull();

      service.deleteProduct(1).subscribe();
      const deleteReq = httpMock.expectOne(`${apiUrl}/products/1`);
      deleteReq.flush(null);

      expect(service.selectedProduct()).toBeNull();
    });
  });

  describe('clearSelectedProduct()', () => {
    it('should clear the selected product', () => {
      service.getProductById(1).subscribe();
      const req = httpMock.expectOne(`${apiUrl}/products/1`);
      req.flush(mockProductResponse);

      expect(service.selectedProduct()).not.toBeNull();

      service.clearSelectedProduct();
      expect(service.selectedProduct()).toBeNull();
    });
  });

  describe('Computed Signals', () => {
    it('should update isEmpty when products change', () => {
      expect(service.isEmpty()).toBeTrue();

      service.getProducts().subscribe();
      const req = httpMock.expectOne(`${apiUrl}/products?page=0&size=10`);
      req.flush(mockProductListResponse);

      expect(service.isEmpty()).toBeFalse();
    });

    it('should update totalProducts from pagination', () => {
      expect(service.totalProducts()).toBe(0);

      const responseWith50Items: ProductListResponse = {
        ...mockProductListResponse,
        meta: {
          ...mockProductListResponse.meta,
          totalElements: 50
        }
      };

      service.getProducts().subscribe();
      const req = httpMock.expectOne(`${apiUrl}/products?page=0&size=10`);
      req.flush(responseWith50Items);

      expect(service.totalProducts()).toBe(50);
    });
  });
});