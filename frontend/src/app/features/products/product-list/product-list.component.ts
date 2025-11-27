import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { ProductService } from '@core/services/product.service';
import { NotificationService } from '@core/services/notification.service';
import { Product, PRODUCT_CATEGORIES } from '@core/models';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { ConfirmModalComponent } from '@shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyPipe, LoadingSpinnerComponent, EmptyStateComponent, PaginationComponent, ConfirmModalComponent],
  template: `
    <div class="page-header">
      <h1 class="page-title">Productos</h1>
      <a routerLink="/products/new" class="btn btn--primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nuevo Producto
      </a>
    </div>

    <div class="filters">
      <div class="filter-group">
        <label class="filter-label">Categoría</label>
        <select class="filter-select" [(ngModel)]="selectedCategory" (change)="onFilterChange()">
          <option value="">Todas</option>
          @for (category of categories; track category) { <option [value]="category">{{ category }}</option> }
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Ordenar por</label>
        <select class="filter-select" [(ngModel)]="sortBy" (change)="onFilterChange()">
          <option value="name">Nombre</option>
          <option value="price">Precio</option>
          <option value="category">Categoría</option>
        </select>
      </div>
    </div>

    @if (productService.loading()) {
      <div class="loading-container"><app-loading-spinner message="Cargando productos..." /></div>
    } @else if (productService.isEmpty()) {
      <app-empty-state icon="products" title="No hay productos" description="Comienza agregando tu primer producto">
        <a routerLink="/products/new" class="btn btn--primary">Crear Producto</a>
      </app-empty-state>
    } @else {
      <div class="table-container">
        <table class="table">
          <thead>
            <tr><th>Producto</th><th>SKU</th><th>Categoría</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            @for (product of productService.products(); track product.id) {
              <tr>
                <td><div class="product-info"><span class="product-name">{{ product.name }}</span></div></td>
                <td><code class="sku">{{ product.sku }}</code></td>
                <td><span class="badge badge--secondary">{{ product.category }}</span></td>
                <td><span class="price">{{ product.price | currency:'USD' }}</span></td>
                <td><span class="badge" [class.badge--success]="product.active" [class.badge--error]="!product.active">{{ product.active ? 'Activo' : 'Inactivo' }}</span></td>
                <td>
                  <div class="actions">
                    <a [routerLink]="['/products', product.id, 'edit']" class="action-btn" title="Editar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </a>
                    <a [routerLink]="['/inventory', product.id]" class="action-btn" title="Inventario">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
                    </a>
                    <button class="action-btn action-btn--danger" title="Eliminar" (click)="confirmDelete(product)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      @if (productService.pagination()) { <app-pagination [meta]="productService.pagination()!" (pageChange)="onPageChange($event)" /> }
    }

    <app-confirm-modal [isOpen]="showDeleteModal()" title="Eliminar Producto" [message]="'¿Eliminar ' + (productToDelete()?.name || '') + '?'" confirmText="Eliminar" type="danger" (confirm)="deleteProduct()" (cancel)="cancelDelete()" />
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .page-title { font-size: 1.875rem; font-weight: 700; margin: 0; color: #f3f4f6; }
    .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1.25rem; border-radius: 8px; font-weight: 500; font-size: 0.875rem; text-decoration: none; cursor: pointer; border: none; transition: all 0.2s; }
    .btn svg { width: 18px; height: 18px; }
    .btn--primary { background-color: #10b981; color: white; }
    .btn--primary:hover { background-color: #059669; }
    .filters { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .filter-group { display: flex; flex-direction: column; gap: 0.375rem; }
    .filter-label { font-size: 0.75rem; color: #9ca3af; text-transform: uppercase; }
    .filter-select { padding: 0.5rem 0.75rem; border: 1px solid #374151; border-radius: 6px; background-color: #1f2937; color: #e5e7eb; font-size: 0.875rem; min-width: 150px; }
    .filter-select:focus { outline: none; border-color: #10b981; }
    .loading-container { display: flex; justify-content: center; padding: 4rem 0; }
    .table-container { background-color: #1f2937; border-radius: 8px; overflow: hidden; border: 1px solid #374151; }
    .table { width: 100%; border-collapse: collapse; }
    .table th { text-align: left; padding: 0.875rem 1rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #9ca3af; background-color: #111827; border-bottom: 1px solid #374151; }
    .table td { padding: 1rem; border-bottom: 1px solid #374151; color: #e5e7eb; }
    .table tbody tr:hover { background-color: rgba(255,255,255,0.02); }
    .table tbody tr:last-child td { border-bottom: none; }
    .product-info { display: flex; flex-direction: column; gap: 0.25rem; }
    .product-name { font-weight: 500; }
    .sku { font-family: monospace; font-size: 0.8125rem; padding: 0.25rem 0.5rem; background-color: #374151; border-radius: 4px; }
    .price { font-family: monospace; font-weight: 500; }
    .badge { display: inline-block; padding: 0.25rem 0.625rem; font-size: 0.75rem; font-weight: 500; border-radius: 9999px; }
    .badge--success { background-color: rgba(16,185,129,0.15); color: #10b981; }
    .badge--error { background-color: rgba(239,68,68,0.15); color: #ef4444; }
    .badge--secondary { background-color: #374151; color: #d1d5db; }
    .actions { display: flex; gap: 0.5rem; }
    .action-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: none; border-radius: 6px; background-color: transparent; color: #9ca3af; cursor: pointer; transition: all 0.2s; }
    .action-btn svg { width: 16px; height: 16px; }
    .action-btn:hover { background-color: #374151; color: white; }
    .action-btn--danger:hover { background-color: rgba(239,68,68,0.15); color: #ef4444; }
  `]
})
export class ProductListComponent implements OnInit {
  readonly productService = inject(ProductService);
  private readonly notificationService = inject(NotificationService);
  categories = PRODUCT_CATEGORIES;
  selectedCategory = '';
  sortBy = 'name';
  showDeleteModal = signal(false);
  productToDelete = signal<Product | null>(null);

  ngOnInit(): void { this.loadProducts(); }

  loadProducts(page = 0): void {
    this.productService.getProducts({ page, category: this.selectedCategory || undefined, sortBy: this.sortBy }).subscribe();
  }

  onFilterChange(): void { this.loadProducts(0); }
  onPageChange(page: number): void { this.loadProducts(page); }
  confirmDelete(product: Product): void { this.productToDelete.set(product); this.showDeleteModal.set(true); }
  cancelDelete(): void { this.showDeleteModal.set(false); this.productToDelete.set(null); }

  deleteProduct(): void {
    const product = this.productToDelete();
    if (!product) return;
    this.showDeleteModal.set(false);
    this.productService.deleteProduct(product.id).subscribe({
      next: () => { this.notificationService.success(`"${product.name}" eliminado.`); this.productToDelete.set(null); },
      error: () => { this.productToDelete.set(null); }
    });
  }
}