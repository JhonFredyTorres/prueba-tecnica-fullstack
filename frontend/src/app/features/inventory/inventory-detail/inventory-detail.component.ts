import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { InventoryService } from '@core/services/inventory.service';
import { ProductService } from '@core/services/product.service';
import { NotificationService } from '@core/services/notification.service';
import { Inventory, Product, InventoryRequest, PurchaseRequest, getStockStatus, getStockStatusLabel, StockStatus } from '@core/models';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { ConfirmModalComponent } from '@shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-inventory-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyPipe, LoadingSpinnerComponent, ConfirmModalComponent],
  template: `
    <div class="page-header">
      <div>
        <a routerLink="/inventory" class="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Volver al inventario
        </a>
        <h1 class="page-title">Gestión de Stock</h1>
      </div>
    </div>

    @if (loading()) {
      <div class="loading-container"><app-loading-spinner message="Cargando información..." /></div>
    } @else if (product()) {
      <div class="inventory-layout">
        <div class="card product-card">
          <div class="card-header">
            <h2>{{ product()!.name }}</h2>
            <span class="badge" [class.badge--success]="stockStatus() === 'available'" [class.badge--warning]="stockStatus() === 'low'" [class.badge--error]="stockStatus() === 'out_of_stock'">{{ stockStatusLabel() }}</span>
          </div>
          <div class="card-body">
            <div class="product-details">
              <div class="detail"><span class="detail-label">SKU</span><code>{{ product()!.sku }}</code></div>
              <div class="detail"><span class="detail-label">Categoría</span><span>{{ product()!.category }}</span></div>
              <div class="detail"><span class="detail-label">Precio</span><span class="mono">{{ product()!.price | currency:'USD' }}</span></div>
            </div>
          </div>
        </div>

        <div class="card stock-card">
          <div class="card-header"><h3>Stock Actual</h3></div>
          <div class="card-body">
            <div class="stock-display">
              <span class="stock-number" [class.stock-number--warning]="stockStatus() === 'low'" [class.stock-number--error]="stockStatus() === 'out_of_stock'">{{ inventory()?.quantity ?? 0 }}</span>
              <span class="stock-label">unidades</span>
            </div>
            <div class="stock-info">
              <div class="info-row"><span>Disponible:</span><span class="mono">{{ inventory()?.availableQuantity ?? 0 }}</span></div>
              <div class="info-row"><span>Reservado:</span><span class="mono">{{ inventory()?.reservedQuantity ?? 0 }}</span></div>
              <div class="info-row"><span>Stock mínimo:</span><span class="mono">{{ inventory()?.minStock ?? 5 }}</span></div>
            </div>
          </div>
        </div>

        <div class="card actions-card">
          <div class="card-header"><h3>Acciones</h3></div>
          <div class="card-body">
            <div class="action-section">
              <h4>Actualizar Stock</h4>
              <p class="action-desc">Establece una nueva cantidad de stock</p>
              <div class="action-form">
                <input type="number" [(ngModel)]="newQuantity" class="form-input" placeholder="Nueva cantidad" min="0"/>
                <button class="btn btn--primary" [disabled]="!canUpdateStock() || processing()" (click)="updateStock()">Actualizar</button>
              </div>
            </div>
            <hr class="divider"/>
            <div class="action-section">
              <h4>Simular Compra</h4>
              <p class="action-desc">Decrementa el stock como si fuera una venta</p>
              <div class="action-form">
                <input type="number" [(ngModel)]="purchaseQuantity" class="form-input" placeholder="Cantidad" min="1" [max]="inventory()?.availableQuantity ?? 0"/>
                <button class="btn btn--secondary" [disabled]="!canPurchase() || processing()" (click)="confirmPurchase()">Procesar</button>
              </div>
              @if (purchaseQuantity && purchaseQuantity > 0) { <p class="total-preview">Total: <strong class="mono">{{ purchaseQuantity * (product()?.price ?? 0) | currency:'USD' }}</strong></p> }
            </div>
            <hr class="divider"/>
            <div class="action-section">
              <h4>Stock Mínimo</h4>
              <p class="action-desc">Configura el nivel de alerta</p>
              <div class="action-form">
                <input type="number" [(ngModel)]="newMinStock" class="form-input" placeholder="Mínimo" min="0"/>
                <button class="btn btn--secondary" [disabled]="!canUpdateMinStock() || processing()" (click)="updateMinStock()">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="error-card"><h3>Producto no encontrado</h3><p>El producto solicitado no existe o fue eliminado.</p><a routerLink="/inventory" class="btn btn--primary">Volver al inventario</a></div>
    }

    <app-confirm-modal [isOpen]="showPurchaseModal()" title="Confirmar Compra" [message]="'¿Procesar compra de ' + purchaseQuantity + ' unidades?'" confirmText="Procesar" type="info" (confirm)="processPurchase()" (cancel)="cancelPurchase()" />
  `,
  styles: [`
    .page-header { margin-bottom: 1.5rem; }
    .back-link { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #9ca3af; text-decoration: none; margin-bottom: 0.5rem; }
    .back-link svg { width: 16px; height: 16px; }
    .back-link:hover { color: #10b981; }
    .page-title { font-size: 1.875rem; font-weight: 700; color: #f3f4f6; margin: 0; }
    .loading-container { display: flex; justify-content: center; padding: 4rem 0; }
    .inventory-layout { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
    @media (max-width: 1024px) { .inventory-layout { grid-template-columns: 1fr; } }
    .card { background-color: #1f2937; border-radius: 12px; border: 1px solid #374151; overflow: hidden; }
    .product-card { grid-column: 1 / -1; }
    .card-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem; border-bottom: 1px solid #374151; }
    .card-header h2, .card-header h3 { margin: 0; font-size: 1.125rem; font-weight: 600; color: #f3f4f6; }
    .card-body { padding: 1.25rem; }
    .badge { padding: 0.25rem 0.625rem; font-size: 0.75rem; font-weight: 500; border-radius: 9999px; }
    .badge--success { background-color: rgba(16,185,129,0.15); color: #10b981; }
    .badge--warning { background-color: rgba(245,158,11,0.15); color: #f59e0b; }
    .badge--error { background-color: rgba(239,68,68,0.15); color: #ef4444; }
    .product-details { display: flex; gap: 2rem; flex-wrap: wrap; }
    .detail { display: flex; flex-direction: column; gap: 0.25rem; }
    .detail-label { font-size: 0.75rem; color: #9ca3af; text-transform: uppercase; }
    .detail code { font-family: monospace; font-size: 0.875rem; padding: 0.25rem 0.5rem; background-color: #374151; border-radius: 4px; }
    .stock-display { text-align: center; margin-bottom: 1.5rem; }
    .stock-number { display: block; font-size: 3rem; font-weight: 700; font-family: monospace; color: #10b981; line-height: 1; }
    .stock-number--warning { color: #f59e0b; }
    .stock-number--error { color: #ef4444; }
    .stock-label { color: #9ca3af; font-size: 0.875rem; }
    .stock-info { display: flex; flex-direction: column; gap: 0.5rem; }
    .info-row { display: flex; justify-content: space-between; font-size: 0.875rem; }
    .info-row span:first-child { color: #9ca3af; }
    .mono { font-family: monospace; }
    .action-section h4 { font-size: 0.9375rem; font-weight: 600; color: #f3f4f6; margin: 0 0 0.25rem; }
    .action-desc { font-size: 0.8125rem; color: #9ca3af; margin: 0 0 0.75rem; }
    .action-form { display: flex; gap: 0.75rem; }
    @media (max-width: 640px) { .action-form { flex-direction: column; } }
    .form-input { flex: 1; padding: 0.625rem 0.875rem; border: 1px solid #374151; border-radius: 6px; background-color: #111827; color: #e5e7eb; font-size: 0.9375rem; }
    .form-input:focus { outline: none; border-color: #10b981; }
    .total-preview { margin: 0.75rem 0 0; font-size: 0.875rem; color: #9ca3af; }
    .divider { border: none; border-top: 1px solid #374151; margin: 1.25rem 0; }
    .btn { padding: 0.625rem 1.25rem; border-radius: 6px; font-weight: 500; font-size: 0.875rem; cursor: pointer; border: none; text-decoration: none; transition: all 0.2s; white-space: nowrap; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn--primary { background-color: #10b981; color: white; }
    .btn--primary:hover:not(:disabled) { background-color: #059669; }
    .btn--secondary { background-color: #374151; color: #e5e7eb; }
    .btn--secondary:hover:not(:disabled) { background-color: #4b5563; }
    .error-card { background-color: #1f2937; border-radius: 12px; padding: 3rem; text-align: center; }
    .error-card h3 { color: #f3f4f6; margin: 0 0 0.5rem; }
    .error-card p { color: #9ca3af; margin: 0 0 1.5rem; }
  `]
})
export class InventoryDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly inventoryService = inject(InventoryService);
  private readonly productService = inject(ProductService);
  private readonly notificationService = inject(NotificationService);

  loading = signal(true);
  processing = signal(false);
  product = signal<Product | null>(null);
  inventory = signal<Inventory | null>(null);
  showPurchaseModal = signal(false);

  newQuantity: number | null = null;
  purchaseQuantity: number | null = null;
  newMinStock: number | null = null;

  stockStatus = computed<StockStatus>(() => { const inv = this.inventory(); return inv ? getStockStatus(inv.quantity, inv.minStock) : 'out_of_stock'; });
  stockStatusLabel = computed(() => getStockStatusLabel(this.stockStatus()));

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('productId');
    if (productId) this.loadData(parseInt(productId, 10));
    else this.loading.set(false);
  }

  private loadData(productId: number): void {
    this.loading.set(true);
    this.productService.getProductById(productId).subscribe({
      next: (product) => { this.product.set(product); this.loadInventory(productId); },
      error: () => { this.loading.set(false); this.notificationService.error('No se pudo cargar el producto.'); }
    });
  }

  private loadInventory(productId: number): void {
    this.inventoryService.getInventoryByProductId(productId).subscribe({
      next: (inventory) => { this.inventory.set(inventory); this.newMinStock = inventory.minStock; this.loading.set(false); },
      error: () => { this.inventory.set({ id: 0, productId, quantity: 0, reservedQuantity: 0, minStock: 5, availableQuantity: 0, lowStock: true }); this.newMinStock = 5; this.loading.set(false); }
    });
  }

  canUpdateStock(): boolean { return this.newQuantity !== null && this.newQuantity >= 0; }
  canPurchase(): boolean { const inv = this.inventory(); return this.purchaseQuantity !== null && this.purchaseQuantity > 0 && inv !== null && this.purchaseQuantity <= inv.availableQuantity; }
  canUpdateMinStock(): boolean { return this.newMinStock !== null && this.newMinStock >= 0; }

  updateStock(): void {
    if (!this.canUpdateStock() || !this.product()) return;
    this.processing.set(true);
    const productId = this.product()!.id;
    const inv = this.inventory();
    if (inv && inv.id > 0) {
      this.inventoryService.updateQuantity(productId, this.newQuantity!).subscribe({
        next: (updated) => { this.inventory.set(updated); this.notificationService.success('Stock actualizado.'); this.newQuantity = null; this.processing.set(false); },
        error: () => this.processing.set(false)
      });
    } else {
      const request: InventoryRequest = { productId, quantity: this.newQuantity!, minStock: this.newMinStock ?? 5 };
      this.inventoryService.createOrUpdateInventory(request).subscribe({
        next: (created) => { this.inventory.set(created); this.notificationService.success('Inventario creado.'); this.newQuantity = null; this.processing.set(false); },
        error: () => this.processing.set(false)
      });
    }
  }

  confirmPurchase(): void { if (this.canPurchase()) this.showPurchaseModal.set(true); }
  cancelPurchase(): void { this.showPurchaseModal.set(false); }

  processPurchase(): void {
    if (!this.canPurchase() || !this.product()) return;
    this.showPurchaseModal.set(false);
    this.processing.set(true);
    this.inventoryService.processPurchase(this.product()!.id, { quantity: this.purchaseQuantity! }).subscribe({
      next: (updated) => { this.inventory.set(updated); this.notificationService.success(`Compra procesada: ${this.purchaseQuantity} unidades.`); this.purchaseQuantity = null; this.processing.set(false); },
      error: () => this.processing.set(false)
    });
  }

  updateMinStock(): void {
    if (!this.canUpdateMinStock() || !this.product()) return;
    this.processing.set(true);
    const request: InventoryRequest = { productId: this.product()!.id, quantity: this.inventory()?.quantity ?? 0, minStock: this.newMinStock! };
    this.inventoryService.createOrUpdateInventory(request).subscribe({
      next: (updated) => { this.inventory.set(updated); this.notificationService.success('Stock mínimo actualizado.'); this.processing.set(false); },
      error: () => this.processing.set(false)
    });
  }
}