import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ProductService } from '@core/services/product.service';
import { InventoryService } from '@core/services/inventory.service';
import { NotificationService } from '@core/services/notification.service';
import { Product, Inventory, getStockStatus, getStockStatusLabel, StockStatus } from '@core/models';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, LoadingSpinnerComponent, EmptyStateComponent, PaginationComponent],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Inventario</h1>
        <p class="page-subtitle">Gestiona el stock de tus productos</p>
      </div>
      @if (lowStockCount() > 0) {
        <div class="alert alert--warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>{{ lowStockCount() }} producto(s) con stock bajo</span>
        </div>
      }
    </div>

    @if (loading()) {
      <div class="loading-container"><app-loading-spinner message="Cargando inventario..." /></div>
    } @else if (products().length === 0) {
      <app-empty-state icon="inventory" title="No hay productos" description="Primero debes crear productos">
        <a routerLink="/products/new" class="btn btn--primary">Crear Producto</a>
      </app-empty-state>
    } @else {
      <div class="inventory-grid">
        @for (product of products(); track product.id) {
          <div class="inventory-card">
            <div class="card-header">
              <div class="card-title"><h3>{{ product.name }}</h3><code class="sku">{{ product.sku }}</code></div>
              <span class="badge" [class.badge--success]="getProductStockStatus(product.id) === 'available'" [class.badge--warning]="getProductStockStatus(product.id) === 'low'" [class.badge--error]="getProductStockStatus(product.id) === 'out_of_stock'">{{ getProductStockStatusLabel(product.id) }}</span>
            </div>
            <div class="card-body">
              <div class="stats">
                <div class="stat"><span class="stat-value">{{ getProductQuantity(product.id) }}</span><span class="stat-label">Stock Actual</span></div>
                <div class="stat"><span class="stat-value">{{ getProductMinStock(product.id) }}</span><span class="stat-label">Stock Mínimo</span></div>
                <div class="stat"><span class="stat-value">{{ product.price | currency:'USD' }}</span><span class="stat-label">Precio</span></div>
              </div>
              <div class="stock-bar"><div class="stock-bar__fill" [class.stock-bar__fill--success]="getProductStockStatus(product.id) === 'available'" [class.stock-bar__fill--warning]="getProductStockStatus(product.id) === 'low'" [class.stock-bar__fill--error]="getProductStockStatus(product.id) === 'out_of_stock'" [style.width.%]="getStockPercentage(product.id)"></div></div>
            </div>
            <div class="card-footer">
              <a [routerLink]="['/inventory', product.id]" class="btn btn--secondary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Gestionar Stock
              </a>
            </div>
          </div>
        }
      </div>
      @if (productService.pagination()) { <app-pagination [meta]="productService.pagination()!" (pageChange)="onPageChange($event)" /> }
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
    .page-title { font-size: 1.875rem; font-weight: 700; color: #f3f4f6; margin: 0; }
    .page-subtitle { color: #9ca3af; margin: 0.25rem 0 0; }
    .alert { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.875rem; }
    .alert svg { width: 18px; height: 18px; flex-shrink: 0; }
    .alert--warning { background-color: rgba(245,158,11,0.15); color: #f59e0b; }
    .loading-container { display: flex; justify-content: center; padding: 4rem 0; }
    .inventory-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
    .inventory-card { background-color: #1f2937; border-radius: 12px; border: 1px solid #374151; overflow: hidden; transition: border-color 0.2s; }
    .inventory-card:hover { border-color: #4b5563; }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 1.25rem; border-bottom: 1px solid #374151; }
    .card-title h3 { font-size: 1rem; font-weight: 600; color: #f3f4f6; margin: 0 0 0.25rem; }
    .sku { font-family: monospace; font-size: 0.75rem; color: #9ca3af; }
    .badge { padding: 0.25rem 0.625rem; font-size: 0.75rem; font-weight: 500; border-radius: 9999px; flex-shrink: 0; }
    .badge--success { background-color: rgba(16,185,129,0.15); color: #10b981; }
    .badge--warning { background-color: rgba(245,158,11,0.15); color: #f59e0b; }
    .badge--error { background-color: rgba(239,68,68,0.15); color: #ef4444; }
    .card-body { padding: 1.25rem; }
    .stats { display: flex; gap: 1rem; margin-bottom: 1rem; }
    .stat { flex: 1; text-align: center; }
    .stat-value { display: block; font-size: 1.25rem; font-weight: 600; font-family: monospace; color: #f3f4f6; }
    .stat-label { font-size: 0.75rem; color: #9ca3af; }
    .stock-bar { height: 6px; background-color: #374151; border-radius: 3px; overflow: hidden; }
    .stock-bar__fill { height: 100%; border-radius: 3px; transition: width 0.3s ease; }
    .stock-bar__fill--success { background-color: #10b981; }
    .stock-bar__fill--warning { background-color: #f59e0b; }
    .stock-bar__fill--error { background-color: #ef4444; }
    .card-footer { padding: 1rem 1.25rem; border-top: 1px solid #374151; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; padding: 0.625rem 1rem; border-radius: 8px; font-weight: 500; font-size: 0.875rem; text-decoration: none; cursor: pointer; border: none; transition: all 0.2s; }
    .btn svg { width: 16px; height: 16px; }
    .btn--primary { background-color: #10b981; color: white; }
    .btn--primary:hover { background-color: #059669; }
    .btn--secondary { background-color: #374151; color: #e5e7eb; }
    .btn--secondary:hover { background-color: #4b5563; }
  `]
})
export class InventoryListComponent implements OnInit {
  readonly productService = inject(ProductService);
  private readonly inventoryService = inject(InventoryService);
  private readonly notificationService = inject(NotificationService);

  loading = signal(true);
  products = signal<Product[]>([]);
  inventoryMap = signal<Map<number, Inventory>>(new Map());
  lowStockCount = signal(0);

  ngOnInit(): void { this.loadData(); }

  loadData(page = 0): void {
    this.loading.set(true);
    this.productService.getProducts({ page, size: 12 }).subscribe({
      next: (response) => {
        const productsList = response.data.map(item => ({
          id: parseInt(item.id, 10), name: item.attributes.name, description: item.attributes.description,
          price: item.attributes.price, category: item.attributes.category, sku: item.attributes.sku, active: item.attributes.active
        }));
        this.products.set(productsList);
        this.loadInventoryForProducts(productsList);
      },
      error: () => { this.loading.set(false); this.notificationService.error('Error al cargar productos'); }
    });
  }

  private loadInventoryForProducts(products: Product[]): void {
    if (products.length === 0) { this.loading.set(false); return; }
    let completed = 0, lowStock = 0;
    const map = new Map<number, Inventory>();
    products.forEach(product => {
      this.inventoryService.getInventoryByProductId(product.id).subscribe({
        next: (inventory) => {
          map.set(product.id, inventory);
          if (inventory.lowStock) lowStock++;
          if (++completed === products.length) { this.inventoryMap.set(map); this.lowStockCount.set(lowStock); this.loading.set(false); }
        },
        error: () => {
          map.set(product.id, { id: 0, productId: product.id, quantity: 0, reservedQuantity: 0, minStock: 5, availableQuantity: 0, lowStock: true });
          lowStock++;
          if (++completed === products.length) { this.inventoryMap.set(map); this.lowStockCount.set(lowStock); this.loading.set(false); }
        }
      });
    });
  }

  getProductQuantity(productId: number): number { return this.inventoryMap().get(productId)?.quantity ?? 0; }
  getProductMinStock(productId: number): number { return this.inventoryMap().get(productId)?.minStock ?? 5; }
  getProductStockStatus(productId: number): StockStatus { const inv = this.inventoryMap().get(productId); return inv ? getStockStatus(inv.quantity, inv.minStock) : 'out_of_stock'; }
  getProductStockStatusLabel(productId: number): string { return getStockStatusLabel(this.getProductStockStatus(productId)); }
  getStockPercentage(productId: number): number { const inv = this.inventoryMap().get(productId); if (!inv || inv.quantity === 0) return 0; return Math.min((inv.quantity / (inv.minStock * 3)) * 100, 100); }
  onPageChange(page: number): void { this.loadData(page); }
}