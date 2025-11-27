import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { isApiError, getErrorMessage } from '../models';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ocurrió un error inesperado.';

      if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor.';
        notificationService.error(errorMessage);
        return throwError(() => error);
      }

      if (error.error && isApiError(error.error)) {
        const apiError = error.error.errors[0];
        errorMessage = apiError.detail || getErrorMessage(apiError.code);
        notificationService.error(errorMessage);
        return throwError(() => error);
      }

      switch (error.status) {
        case 401: errorMessage = 'No autorizado. Verifica tu API Key.'; break;
        case 403: errorMessage = 'No tienes permisos para esta acción.'; break;
        case 404: errorMessage = 'El recurso no fue encontrado.'; break;
        case 409: errorMessage = 'Conflicto: el recurso ya existe.'; break;
        case 422: errorMessage = 'Los datos enviados no son válidos.'; break;
        case 500: case 502: case 503: errorMessage = 'Error del servidor.'; break;
      }

      notificationService.error(errorMessage);
      return throwError(() => error);
    })
  );
};