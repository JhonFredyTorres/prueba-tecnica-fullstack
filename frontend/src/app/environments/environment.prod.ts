export const environment = {
  production: true,
  apiUrls: {
    products: '/api/products',
    inventory: '/api/inventory'
  },
  apiKey: 'my-secret-api-key-12345',
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 25, 50]
  }
};