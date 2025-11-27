import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '@env/environment';

export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  const isOurApi = req.url.startsWith(environment.apiUrls.products) ||
                   req.url.startsWith(environment.apiUrls.inventory);
  
  if (isOurApi) {
    const clonedRequest = req.clone({
      setHeaders: { 'X-API-Key': environment.apiKey }
    });
    return next(clonedRequest);
  }
  return next(req);
};