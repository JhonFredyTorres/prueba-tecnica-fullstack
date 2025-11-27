import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor } from './error.interceptor';
import { NotificationService } from '../services/notification.service';

describe('errorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let notificationService: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        NotificationService
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    notificationService = TestBed.inject(NotificationService);
    
    // Clear notifications before each test
    notificationService.clear();
  });

  afterEach(() => {
    httpMock.verify();
    notificationService.clear();
  });

  describe('Network Errors (status 0)', () => {
    it('should show network error notification', () => {
      spyOn(notificationService, 'error');

      httpClient.get('/api/test').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/test');
      req.error(new ProgressEvent('Network error'), { status: 0 });

      expect(notificationService.error).toHaveBeenCalledWith('No se pudo conectar con el servidor.');
    });
  });

  describe('API Errors (JSON:API format)', () => {
    it('should show API error detail message', () => {
      spyOn(notificationService, 'error');

      httpClient.get('/api/test').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(
        {
          errors: [
            {
              status: '404',
              code: 'PRODUCT_NOT_FOUND',
              title: 'Not Found',
              detail: 'Product with ID 999 not found'
            }
          ]
        },
        { status: 404, statusText: 'Not Found' }
      );

      expect(notificationService.error).toHaveBeenCalledWith('Product with ID 999 not found');
    });

    it('should fallback to error code message when detail is empty', () => {
      spyOn(notificationService, 'error');

      httpClient.get('/api/test').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(
        {
          errors: [
            {
              status: '409',
              code: 'DUPLICATE_SKU',
              title: 'Conflict',
              detail: ''
            }
          ]
        },
        { status: 409, statusText: 'Conflict' }
      );

      expect(notificationService.error).toHaveBeenCalledWith('Ya existe un producto con ese código SKU.');
    });
  });

  describe('HTTP Status Errors', () => {
    it('should show 401 unauthorized message', () => {
      spyOn(notificationService, 'error');

      httpClient.get('/api/test').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(notificationService.error).toHaveBeenCalledWith('No autorizado. Verifica tu API Key.');
    });

    it('should show 403 forbidden message', () => {
      spyOn(notificationService, 'error');

      httpClient.get('/api/test').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

      expect(notificationService.error).toHaveBeenCalledWith('No tienes permisos para esta acción.');
    });

    it('should show 404 not found message', () => {
      spyOn(notificationService, 'error');

      httpClient.get('/api/test').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(notificationService.error).toHaveBeenCalledWith('El recurso no fue encontrado.');
    });

    it('should show 409 conflict message', () => {
      spyOn(notificationService, 'error');

      httpClient.get('/api/test').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });

      expect(notificationService.error).toHaveBeenCalledWith('Conflicto: el recurso ya existe.');
    });

    it('should show 422 validation error message', () => {
      spyOn(notificationService, 'error');

      httpClient.get('/api/test').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Unprocessable Entity', { status: 422, statusText: 'Unprocessable Entity' });

      expect(notificationService.error).toHaveBeenCalledWith('Los datos enviados no son válidos.');
    });

    it('should show 500 server error message', () => {
      spyOn(notificationService, 'error');

      httpClient.get('/api/test').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(notificationService.error).toHaveBeenCalledWith('Error del servidor.');
    });

    it('should show 502 server error message', () => {
      spyOn(notificationService, 'error');

      httpClient.get('/api/test').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Bad Gateway', { status: 502, statusText: 'Bad Gateway' });

      expect(notificationService.error).toHaveBeenCalledWith('Error del servidor.');
    });

    it('should show 503 server error message', () => {
      spyOn(notificationService, 'error');

      httpClient.get('/api/test').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });

      expect(notificationService.error).toHaveBeenCalledWith('Error del servidor.');
    });
  });

  describe('Unknown Errors', () => {
    it('should show default error message for unknown status codes', () => {
      spyOn(notificationService, 'error');

      httpClient.get('/api/test').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Unknown Error', { status: 418, statusText: 'I am a teapot' });

      expect(notificationService.error).toHaveBeenCalledWith('Ocurrió un error inesperado.');
    });
  });

  describe('Error Propagation', () => {
    it('should rethrow the error after showing notification', (done) => {
      httpClient.get('/api/test').subscribe({
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should allow error handling in subscriber', (done) => {
      let errorHandled = false;

      httpClient.get('/api/test').subscribe({
        next: () => fail('Should not succeed'),
        error: () => {
          errorHandled = true;
          expect(errorHandled).toBeTrue();
          done();
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('Successful Requests', () => {
    it('should not show notification for successful requests', () => {
      spyOn(notificationService, 'error');

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      req.flush({ data: 'success' });

      expect(notificationService.error).not.toHaveBeenCalled();
    });
  });
});