import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, map, finalize } from 'rxjs';
import { environment } from '@env/environment';
import { Product, ProductRequest, ProductResponse, ProductListResponse, ProductSearchParams, PaginationMeta, ProductData } from '../models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrls.products;

  private productsSignal = signal<Product[]>([]);
  private selectedProductSignal = signal<Product | null>(null);
  private paginationSignal = signal<PaginationMeta | null>(null);
  private loadingSignal = signal(false);

  readonly products = this.productsSignal.asReadonly();
  readonly selectedProduct = this.selectedProductSignal.asReadonly();
  readonly pagination = this.paginationSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly totalProducts = computed(() => this.paginationSignal()?.totalElements ?? 0);
  readonly isEmpty = computed(() => this.productsSignal().length === 0 && !this.loadingSignal());

  getProducts(params: ProductSearchParams = {}): Observable<ProductListResponse> {
    this.loadingSignal.set(true);
    let httpParams = new HttpParams()
      .set('page', (params.page ?? 0).toString())
      .set('size', (params.size ?? environment.pagination.defaultPageSize).toString());
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.active !== undefined) httpParams = httpParams.set('active', params.active.toString());
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortDir) httpParams = httpParams.set('sortDir', params.sortDir);

    return this.http.get<ProductListResponse>(`${this.apiUrl}/products`, { params: httpParams }).pipe(
      tap(response => {
        this.productsSignal.set(response.data.map(item => this.mapToProduct(item)));
        this.paginationSignal.set(response.meta);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  getProductById(id: number): Observable<Product> {
    this.loadingSignal.set(true);
    return this.http.get<ProductResponse>(`${this.apiUrl}/products/${id}`).pipe(
      map(response => this.mapToProduct(response.data)),
      tap(product => this.selectedProductSignal.set(product)),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  createProduct(request: ProductRequest): Observable<Product> {
    this.loadingSignal.set(true);
    return this.http.post<ProductResponse>(`${this.apiUrl}/products`, request).pipe(
      map(response => this.mapToProduct(response.data)),
      tap(product => this.productsSignal.update(products => [product, ...products])),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  updateProduct(id: number, request: ProductRequest): Observable<Product> {
    this.loadingSignal.set(true);
    return this.http.put<ProductResponse>(`${this.apiUrl}/products/${id}`, request).pipe(
      map(response => this.mapToProduct(response.data)),
      tap(updatedProduct => {
        this.productsSignal.update(products => products.map(p => p.id === id ? updatedProduct : p));
        this.selectedProductSignal.set(updatedProduct);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  deleteProduct(id: number): Observable<void> {
    this.loadingSignal.set(true);
    return this.http.delete<void>(`${this.apiUrl}/products/${id}`).pipe(
      tap(() => {
        this.productsSignal.update(products => products.filter(p => p.id !== id));
        if (this.selectedProductSignal()?.id === id) this.selectedProductSignal.set(null);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  private mapToProduct(data: ProductData): Product {
    return {
      id: parseInt(data.id, 10),
      name: data.attributes.name,
      description: data.attributes.description,
      price: data.attributes.price,
      category: data.attributes.category,
      sku: data.attributes.sku,
      active: data.attributes.active,
      createdAt: data.attributes.createdAt,
      updatedAt: data.attributes.updatedAt
    };
  }

  clearSelectedProduct(): void { this.selectedProductSignal.set(null); }
}