import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  {
    path: 'products',
    loadComponent: () => import('./features/products/product-list/product-list.component').then(m => m.ProductListComponent),
    title: 'Productos'
  },
  {
    path: 'products/new',
    loadComponent: () => import('./features/products/product-form/product-form.component').then(m => m.ProductFormComponent),
    title: 'Nuevo Producto'
  },
  {
    path: 'products/:id/edit',
    loadComponent: () => import('./features/products/product-form/product-form.component').then(m => m.ProductFormComponent),
    title: 'Editar Producto'
  },
  {
    path: 'inventory',
    loadComponent: () => import('./features/inventory/inventory-list/inventory-list.component').then(m => m.InventoryListComponent),
    title: 'Inventario'
  },
  {
    path: 'inventory/:productId',
    loadComponent: () => import('./features/inventory/inventory-detail/inventory-detail.component').then(m => m.InventoryDetailComponent),
    title: 'Gestión de Stock'
  },
  { path: '**', redirectTo: 'products' }
];