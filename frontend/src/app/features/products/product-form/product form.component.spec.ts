import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { ProductFormComponent } from './product-form.component';
import { ProductService } from '@core/services/product.service';
import { NotificationService } from '@core/services/notification.service';
import { ProductResponse } from '@core/models';
import { environment } from '@env/environment';

describe('ProductFormComponent', () => {
  let component: ProductFormComponent;
  let fixture: ComponentFixture<ProductFormComponent>;
  let httpMock: HttpTestingController;
  let notificationService: NotificationService;

  const mockProductResponse: ProductResponse = {
    data: {
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
    }
  };

  function createComponent(routeParams: any = {}) {
    TestBed.configureTestingModule({
      imports: [ProductFormComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ProductService,
        NotificationService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => routeParams[key] || null
              }
            }
          }
        }
      ]
    });

    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    notificationService = TestBed.inject(NotificationService);
  }

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
  });

  describe('Create Mode', () => {
    beforeEach(() => {
      createComponent();
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should not be in edit mode', () => {
      expect(component.isEditMode()).toBeFalse();
    });

    it('should have empty form', () => {
      expect(component.form.get('name')?.value).toBe('');
      expect(component.form.get('sku')?.value).toBe('');
      expect(component.form.get('price')?.value).toBeNull();
      expect(component.form.get('category')?.value).toBe('');
      expect(component.form.get('description')?.value).toBe('');
    });

    it('should have categories available', () => {
      expect(component.categories.length).toBeGreaterThan(0);
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      createComponent({ id: '1' });
      fixture.detectChanges();
    });

    it('should be in edit mode', () => {
      const req = httpMock.expectOne(`${environment.apiUrls.products}/products/1`);
      req.flush(mockProductResponse);
      fixture.detectChanges();

      expect(component.isEditMode()).toBeTrue();
      expect(component.productId()).toBe(1);
    });

    it('should load product data into form', () => {
      const req = httpMock.expectOne(`${environment.apiUrls.products}/products/1`);
      req.flush(mockProductResponse);
      fixture.detectChanges();

      expect(component.form.get('name')?.value).toBe('Test Product');
      expect(component.form.get('sku')?.value).toBe('TEST-001');
      expect(component.form.get('price')?.value).toBe(99.99);
      expect(component.form.get('category')?.value).toBe('Electronics');
      expect(component.form.get('description')?.value).toBe('Test Description');
    });

    it('should show loading while fetching product', () => {
      expect(component.loading()).toBeTrue();
      
      const req = httpMock.expectOne(`${environment.apiUrls.products}/products/1`);
      req.flush(mockProductResponse);
      
      expect(component.loading()).toBeFalse();
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      createComponent();
      fixture.detectChanges();
    });

    it('should require name', () => {
      const nameControl = component.form.get('name');
      nameControl?.setValue('');
      nameControl?.markAsTouched();

      expect(nameControl?.valid).toBeFalse();
      expect(component.isFieldInvalid('name')).toBeTrue();
    });

    it('should require name min length of 2', () => {
      const nameControl = component.form.get('name');
      nameControl?.setValue('A');
      nameControl?.markAsTouched();

      expect(nameControl?.valid).toBeFalse();
    });

    it('should accept valid name', () => {
      const nameControl = component.form.get('name');
      nameControl?.setValue('Valid Product Name');
      nameControl?.markAsTouched();

      expect(nameControl?.valid).toBeTrue();
      expect(component.isFieldInvalid('name')).toBeFalse();
    });

    it('should require SKU', () => {
      const skuControl = component.form.get('sku');
      skuControl?.setValue('');
      skuControl?.markAsTouched();

      expect(skuControl?.valid).toBeFalse();
    });

    it('should validate SKU pattern (alphanumeric and hyphens only)', () => {
      const skuControl = component.form.get('sku');
      
      skuControl?.setValue('INVALID SKU!');
      expect(skuControl?.valid).toBeFalse();

      skuControl?.setValue('VALID-SKU-123');
      expect(skuControl?.valid).toBeTrue();
    });

    it('should require price', () => {
      const priceControl = component.form.get('price');
      priceControl?.setValue(null);
      priceControl?.markAsTouched();

      expect(priceControl?.valid).toBeFalse();
    });

    it('should require price greater than 0', () => {
      const priceControl = component.form.get('price');
      
      priceControl?.setValue(0);
      expect(priceControl?.valid).toBeFalse();

      priceControl?.setValue(-10);
      expect(priceControl?.valid).toBeFalse();

      priceControl?.setValue(0.01);
      expect(priceControl?.valid).toBeTrue();
    });

    it('should require category', () => {
      const categoryControl = component.form.get('category');
      categoryControl?.setValue('');
      categoryControl?.markAsTouched();

      expect(categoryControl?.valid).toBeFalse();
    });

    it('should allow empty description', () => {
      const descriptionControl = component.form.get('description');
      descriptionControl?.setValue('');

      expect(descriptionControl?.valid).toBeTrue();
    });

    it('should limit description to 500 characters', () => {
      const descriptionControl = component.form.get('description');
      descriptionControl?.setValue('A'.repeat(501));

      expect(descriptionControl?.valid).toBeFalse();
    });
  });

  describe('SKU Input', () => {
    beforeEach(() => {
      createComponent();
      fixture.detectChanges();
    });

    it('should convert SKU to uppercase on input', () => {
      const mockEvent = {
        target: { value: 'test-sku' }
      } as unknown as Event;

      component.onSkuInput(mockEvent);

      expect(component.form.get('sku')?.value).toBe('TEST-SKU');
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      createComponent();
      fixture.detectChanges();
    });

    it('should not submit if form is invalid', () => {
      spyOn(component.form, 'markAllAsTouched');
      
      component.onSubmit();

      expect(component.form.markAllAsTouched).toHaveBeenCalled();
      httpMock.expectNone(`${environment.apiUrls.products}/products`);
    });

    it('should submit valid form for create', () => {
      spyOn(notificationService, 'success');

      component.form.patchValue({
        name: 'New Product',
        sku: 'NEW-001',
        price: 49.99,
        category: 'Electronics',
        description: 'A new product'
      });

      component.onSubmit();

      expect(component.submitting()).toBeTrue();

      const req = httpMock.expectOne(`${environment.apiUrls.products}/products`);
      expect(req.request.method).toBe('POST');
      req.flush(mockProductResponse);

      expect(notificationService.success).toHaveBeenCalled();
    });

    it('should trim whitespace from name and description', () => {
      component.form.patchValue({
        name: '  Product Name  ',
        sku: 'SKU-001',
        price: 49.99,
        category: 'Electronics',
        description: '  Description with spaces  '
      });

      component.onSubmit();

      const req = httpMock.expectOne(`${environment.apiUrls.products}/products`);
      const body = req.request.body;
      
      expect(body.name).toBe('Product Name');
      expect(body.description).toBe('Description with spaces');
      
      req.flush(mockProductResponse);
    });

    it('should set description to null if empty', () => {
      component.form.patchValue({
        name: 'Product',
        sku: 'SKU-001',
        price: 49.99,
        category: 'Electronics',
        description: ''
      });

      component.onSubmit();

      const req = httpMock.expectOne(`${environment.apiUrls.products}/products`);
      expect(req.request.body.description).toBeNull();
      req.flush(mockProductResponse);
    });

    it('should reset submitting state on error', () => {
      component.form.patchValue({
        name: 'New Product',
        sku: 'NEW-001',
        price: 49.99,
        category: 'Electronics'
      });

      component.onSubmit();

      const req = httpMock.expectOne(`${environment.apiUrls.products}/products`);
      req.error(new ErrorEvent('Error'), { status: 500 });

      expect(component.submitting()).toBeFalse();
    });
  });

  describe('Form Submission in Edit Mode', () => {
    beforeEach(() => {
      createComponent({ id: '1' });
      fixture.detectChanges();
      
      const getReq = httpMock.expectOne(`${environment.apiUrls.products}/products/1`);
      getReq.flush(mockProductResponse);
      fixture.detectChanges();
    });

    it('should submit PUT request in edit mode', () => {
      spyOn(notificationService, 'success');

      component.form.patchValue({
        name: 'Updated Product',
        price: 149.99
      });

      component.onSubmit();

      const req = httpMock.expectOne(`${environment.apiUrls.products}/products/1`);
      expect(req.request.method).toBe('PUT');
      req.flush({
        data: {
          ...mockProductResponse.data,
          attributes: {
            ...mockProductResponse.data.attributes,
            name: 'Updated Product',
            price: 149.99
          }
        }
      });

      expect(notificationService.success).toHaveBeenCalled();
    });
  });

  describe('isFieldInvalid helper', () => {
    beforeEach(() => {
      createComponent();
      fixture.detectChanges();
    });

    it('should return false for valid untouched field', () => {
      expect(component.isFieldInvalid('name')).toBeFalse();
    });

    it('should return false for valid touched field', () => {
      component.form.get('name')?.setValue('Valid Name');
      component.form.get('name')?.markAsTouched();
      
      expect(component.isFieldInvalid('name')).toBeFalse();
    });

    it('should return true for invalid touched field', () => {
      component.form.get('name')?.setValue('');
      component.form.get('name')?.markAsTouched();
      
      expect(component.isFieldInvalid('name')).toBeTrue();
    });

    it('should return false for invalid untouched field', () => {
      component.form.get('name')?.setValue('');
      
      expect(component.isFieldInvalid('name')).toBeFalse();
    });

    it('should return false for non-existent field', () => {
      expect(component.isFieldInvalid('nonexistent')).toBeFalse();
    });
  });
});