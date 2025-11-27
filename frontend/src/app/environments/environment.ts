/**
 * Environment de desarrollo.
 * 
 * Aquí configuramos las URLs de los microservicios backend
 * y otras variables que cambian entre ambientes.
 */
export const environment = {
  production: false,
  
  // URLs de los microservicios
  apiUrls: {
    products: 'http://localhost:8081/api/v1',
    inventory: 'http://localhost:8082/api/v1'
  },
  
  // API Key para autenticación con el backend
  apiKey: 'my-secret-api-key-12345',
  
  // Configuración de paginación por defecto
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 25, 50]
  }
};