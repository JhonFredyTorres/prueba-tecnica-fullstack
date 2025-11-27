import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductListComponent } from './product-list.component';
import { ProductService } from '@core/services/product.service';
import { NotificationService } from '@core/services/notification.service';
import { ProductListResponse } from '@core/models';
import { environment } from '@env/environment';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let httpMock: HttpTestingController;
  let productService: ProductService;
  let notificationService: NotificationService;

  const mockProductListResponse: ProductListResponse = {
    data: [
      {
        id: '1',
        type: 'products',
        attributes: {
          name: 'Test Product 1',
          description: 'Description 1',
          price: 99.99,
          category: 'Electronics',
          sku: 'TEST-001',
          active: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      },
      {
        id: '2',
        type: 'products',
        attributes: {
          name: 'Test Product 2',
          description: 'Description 2',
          price: 49.99,
          category: 'Clothing',
          sku: 'TEST-002',
          active: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      }
    ],
    meta: {
      totalElements: 2,
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

  const emptyProductListResponse: ProductListResponse = {
    data: [],
    meta: {
      totalElements: 0,
      totalPages: 0,
      currentPage: 0,
      pageSize: 10
    },
    links: {
      self: '/api/v1/products?page=0&size=10',
      first: '/api/v1/products?page=0&size=10',
      last: '/api/v1/products?page=0&size=10'
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ProductService,
        NotificationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    productService = TestBed.inject(ProductService);
    notificationService = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load products on init', () => {
      fixture.detectChanges(); // triggers ngOnInit

      const req = httpMock.expectOne(req => req.url.includes('/products'));
      expect(req.request.method).toBe('GET');
      req.flush(mockProductListResponse);

      expect(productService.products().length).toBe(2);
    });

    it('should have default filter values', () => {
      expect(component.selectedCategory).toBe('');
      expect(component.sortBy).toBe('name');
    });

    it('should have categories available', () => {
      expect(component.categories.length).toBeGreaterThan(0);
    });
  });

  describe('Product Display', () => {
    beforeEach(() => {
      fixture.detectChanges();
      const req = httpMock.expectOne(req => req.url.includes('/products'));
      req.flush(mockProductListResponse);
      fixture.detectChanges();
    });

    it('should display products in the table', () => {
      const compiled = fixture.nativeElement;
      const rows = compiled.querySelectorAll('tbody tr');
      expect(rows.length).toBe(2);
    });

    it('should display product names', () => {
      const compiled = fixture.nativeElement;
      const productNames = compiled.querySelectorAll('.product-name');
      expect(productNames[0].textContent).toContain('Test Product 1');
      expect(productNames[1].textContent).toContain('Test Product 2');
    });

    it('should display product SKUs', () => {
      const compiled = fixture.nativeElement;
      const skus = compiled.querySelectorAll('.sku');
      expect(skus[0].textContent).toContain('TEST-001');
      expect(skus[1].textContent).toContain('TEST-002');
    });

    it('should display product prices', () => {
      const compiled = fixture.nativeElement;
      const prices = compiled.querySelectorAll('.price');
      expect(prices[0].textContent).toContain('$99.99');
      expect(prices[1].textContent).toContain('$49.99');
    });

    it('should display active/inactive status correctly', () => {
      const compiled = fixture.nativeElement;
      const badges = compiled.querySelectorAll('td .badge--success, td .badge--error');
      
      // First product is active
      expect(badges[0].classList.contains('badge--success')).toBeTrue();
      expect(badges[0].textContent).toContain('Activo');
      
      // Second product is inactive
      expect(badges[1].classList.contains('badge--error')).toBeTrue();
      expect(badges[1].textContent).toContain('Inactivo');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no products', () => {
      fixture.detectChanges();
      const req = httpMock.expectOne(req => req.url.includes('/products'));
      req.flush(emptyProductListResponse);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const emptyState = compiled.querySelector('app-empty-state');
      expect(emptyState).toBeTruthy();
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
      const req = httpMock.expectOne(req => req.url.includes('/products'));
      req.flush(mockProductListResponse);
      fixture.detectChanges();
    });

    it('should reload products when category changes', () => {
      component.selectedCategory = 'Electronics';
      component.onFilterChange();

      const req = httpMock.expectOne(req => req.url.includes('/products'));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('category')).toBe('Electronics');
      req.flush(mockProductListResponse);
    });

    it('should reload products when sort changes', () => {
      component.sortBy = 'price';
      component.onFilterChange();

      const req = httpMock.expectOne(req => req.url.includes('/products'));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('sortBy')).toBe('price');
      req.flush(mockProductListResponse);
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      fixture.detectChanges();
      const req = httpMock.expectOne(req => req.url.includes('/products'));
      req.flush(mockProductListResponse);
      fixture.detectChanges();
    });

    it('should load specific page when page changes', () => {
      component.onPageChange(2);

      const req = httpMock.expectOne(req => req.url.includes('/products'));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('2');
      req.flush(mockProductListResponse);
    });
  });

  describe('Delete Product', () => {
    beforeEach(() => {
      fixture.detectChanges();
      const req = httpMock.expectOne(req => req.url.includes('/products'));
      req.flush(mockProductListResponse);
      fixture.detectChanges();
    });

    it('should open delete modal when confirmDelete is called', () => {
      const product = productService.products()[0];
      component.confirmDelete(product);

      expect(component.showDeleteModal()).toBeTrue();
      expect(component.productToDelete()).toEqual(product);
    });

    it('should close modal and clear product when cancelDelete is called', () => {
      const product = productService.products()[0];
      component.confirmDelete(product);
      component.cancelDelete();

      expect(component.showDeleteModal()).toBeFalse();
      expect(component.productToDelete()).toBeNull();
    });

    it('should delete product and show notification on success', () => {
      spyOn(notificationService, 'success');
      
      const product = productService.products()[0];
      component.confirmDelete(product);
      component.deleteProduct();

      const deleteReq = httpMock.expectOne(`${environment.apiUrls.products}/products/1`);
      expect(deleteReq.request.method).toBe('DELETE');
      deleteReq.flush(null);

      expect(component.showDeleteModal()).toBeFalse();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('should close modal on delete error', () => {
      const product = productService.products()[0];
      component.confirmDelete(product);
      component.deleteProduct();

      const deleteReq = httpMock.expectOne(`${environment.apiUrls.products}/products/1`);
      deleteReq.error(new ErrorEvent('Network error'), { status: 500 });

      expect(component.productToDelete()).toBeNull();
    });

    it('should not delete if no product is selected', () => {
      component.deleteProduct();
      // No debe haber peticiones DELETE
      expect(component.productToDelete()).toBeNull();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching products', () => {
      fixture.detectChanges();
      
      // Products are being loaded
      expect(productService.loading()).toBeTrue();
      
      const compiled = fixture.nativeElement;
      const spinner = compiled.querySelector('app-loading-spinner');
      expect(spinner).toBeTruthy();

      // Complete the request
      const req = httpMock.expectOne(req => req.url.includes('/products'));
      req.flush(mockProductListResponse);
      fixture.detectChanges();

      expect(productService.loading()).toBeFalse();
    });
  });

  describe('Navigation Links', () => {
    beforeEach(() => {
      fixture.detectChanges();
      const req = httpMock.expectOne(req => req.url.includes('/products'));
      req.flush(mockProductListResponse);
      fixture.detectChanges();
    });

    it('should have link to create new product', () => {
      const compiled = fixture.nativeElement;
      const newProductLink = compiled.querySelector('a[routerLink="/products/new"]');
      expect(newProductLink).toBeTruthy();
    });

    it('should have edit links for each product', () => {
      const compiled = fixture.nativeElement;
      const editLinks = compiled.querySelectorAll('a[title="Editar"]');
      expect(editLinks.length).toBe(2);
    });

    it('should have inventory links for each product', () => {
      const compiled = fixture.nativeElement;
      const inventoryLinks = compiled.querySelectorAll('a[title="Inventario"]');
      expect(inventoryLinks.length).toBe(2);
    });
  });
});