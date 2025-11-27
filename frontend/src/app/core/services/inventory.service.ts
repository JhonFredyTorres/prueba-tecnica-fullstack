import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, map, finalize, of, catchError } from 'rxjs';
import { environment } from '@env/environment';
import { Inventory, InventoryRequest, InventoryResponse, InventoryListResponse, PurchaseRequest, InventoryData, getStockStatus, StockStatus } from '../models';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrls.inventory;

  private inventorySignal = signal<Inventory | null>(null);
  private lowStockItemsSignal = signal<Inventory[]>([]);
  private loadingSignal = signal(false);

  readonly inventory = this.inventorySignal.asReadonly();
  readonly lowStockItems = this.lowStockItemsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly stockStatus = computed<StockStatus | null>(() => {
    const inv = this.inventorySignal();
    return inv ? getStockStatus(inv.quantity, inv.minStock) : null;
  });
  readonly lowStockCount = computed(() => this.lowStockItemsSignal().length);

  getInventoryByProductId(productId: number): Observable<Inventory> {
    this.loadingSignal.set(true);
    return this.http.get<InventoryResponse>(`${this.apiUrl}/inventory/product/${productId}`).pipe(
      map(response => this.mapToInventory(response.data)),
      tap(inventory => this.inventorySignal.set(inventory)),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  createOrUpdateInventory(request: InventoryRequest): Observable<Inventory> {
    this.loadingSignal.set(true);
    return this.http.post<InventoryResponse>(`${this.apiUrl}/inventory`, request).pipe(
      map(response => this.mapToInventory(response.data)),
      tap(inventory => this.inventorySignal.set(inventory)),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  updateQuantity(productId: number, quantity: number): Observable<Inventory> {
    this.loadingSignal.set(true);
    const params = new HttpParams().set('quantity', quantity.toString());
    return this.http.patch<InventoryResponse>(`${this.apiUrl}/inventory/product/${productId}/quantity`, null, { params }).pipe(
      map(response => this.mapToInventory(response.data)),
      tap(inventory => this.inventorySignal.set(inventory)),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  processPurchase(productId: number, request: PurchaseRequest): Observable<Inventory> {
    this.loadingSignal.set(true);
    return this.http.post<InventoryResponse>(`${this.apiUrl}/inventory/product/${productId}/purchase`, request).pipe(
      map(response => this.mapToInventory(response.data)),
      tap(inventory => this.inventorySignal.set(inventory)),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  checkStock(productId: number, quantity: number): Observable<boolean> {
    const params = new HttpParams().set('quantity', quantity.toString());
    return this.http.get<boolean>(`${this.apiUrl}/inventory/product/${productId}/check-stock`, { params });
  }

  getLowStockItems(): Observable<Inventory[]> {
    return this.http.get<InventoryListResponse>(`${this.apiUrl}/inventory/low-stock`).pipe(
      map(response => response.data.map(item => this.mapToInventory(item))),
      tap(items => this.lowStockItemsSignal.set(items)),
      catchError(() => { this.lowStockItemsSignal.set([]); return of([]); })
    );
  }

  deleteInventory(productId: number): Observable<void> {
    this.loadingSignal.set(true);
    return this.http.delete<void>(`${this.apiUrl}/inventory/product/${productId}`).pipe(
      tap(() => { if (this.inventorySignal()?.productId === productId) this.inventorySignal.set(null); }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  private mapToInventory(data: InventoryData): Inventory {
    return {
      id: parseInt(data.id, 10),
      productId: data.attributes.productId,
      quantity: data.attributes.quantity,
      reservedQuantity: data.attributes.reservedQuantity,
      minStock: data.attributes.minStock,
      availableQuantity: data.attributes.availableQuantity,
      lowStock: data.attributes.lowStock,
      product: data.attributes.product,
      createdAt: data.attributes.createdAt,
      updatedAt: data.attributes.updatedAt
    };
  }

  clearInventory(): void { this.inventorySignal.set(null); }
}