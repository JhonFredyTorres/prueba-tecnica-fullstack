import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '@core/services/product.service';
import { NotificationService } from '@core/services/notification.service';
import { PRODUCT_CATEGORIES } from '@core/models';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, LoadingSpinnerComponent],
  template: `
    <div class="page-header">
      <div>
        <a routerLink="/products" class="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Volver a productos
        </a>
        <h1 class="page-title">{{ isEditMode() ? 'Editar Producto' : 'Nuevo Producto' }}</h1>
      </div>
    </div>

    @if (loading()) {
      <div class="loading-container"><app-loading-spinner message="Cargando producto..." /></div>
    } @else {
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-card">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="name">Nombre <span class="required">*</span></label>
            <input type="text" id="name" formControlName="name" class="form-input" [class.form-input--error]="isFieldInvalid('name')" placeholder="Ej: Laptop Gaming Pro"/>
            @if (isFieldInvalid('name')) { <span class="form-error">El nombre es obligatorio (2-100 caracteres)</span> }
          </div>

          <div class="form-group">
            <label class="form-label" for="sku">SKU <span class="required">*</span></label>
            <input type="text" id="sku" formControlName="sku" class="form-input form-input--mono" [class.form-input--error]="isFieldInvalid('sku')" placeholder="Ej: LAP-001" (input)="onSkuInput($event)"/>
            @if (isFieldInvalid('sku')) { <span class="form-error">SKU obligatorio (letras, números, guiones)</span> }
          </div>

          <div class="form-group">
            <label class="form-label" for="price">Precio (USD) <span class="required">*</span></label>
            <input type="number" id="price" formControlName="price" class="form-input form-input--mono" [class.form-input--error]="isFieldInvalid('price')" placeholder="0.00" step="0.01" min="0.01"/>
            @if (isFieldInvalid('price')) { <span class="form-error">El precio debe ser mayor a 0</span> }
          </div>

          <div class="form-group">
            <label class="form-label" for="category">Categoría <span class="required">*</span></label>
            <select id="category" formControlName="category" class="form-input" [class.form-input--error]="isFieldInvalid('category')">
              <option value="">Seleccionar categoría</option>
              @for (category of categories; track category) { <option [value]="category">{{ category }}</option> }
            </select>
            @if (isFieldInvalid('category')) { <span class="form-error">La categoría es obligatoria</span> }
          </div>

          <div class="form-group form-group--full">
            <label class="form-label" for="description">Descripción <span class="form-hint">(Opcional)</span></label>
            <textarea id="description" formControlName="description" class="form-input form-textarea" placeholder="Describe las características..." rows="4"></textarea>
          </div>
        </div>

        <div class="form-actions">
          <a routerLink="/products" class="btn btn--secondary">Cancelar</a>
          <button type="submit" class="btn btn--primary" [disabled]="form.invalid || submitting()">
            @if (submitting()) { <app-loading-spinner size="small" /> Guardando... }
            @else {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              {{ isEditMode() ? 'Guardar Cambios' : 'Crear Producto' }}
            }
          </button>
        </div>
      </form>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 1.5rem; }
    .back-link { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #9ca3af; text-decoration: none; margin-bottom: 0.5rem; }
    .back-link svg { width: 16px; height: 16px; }
    .back-link:hover { color: #10b981; }
    .page-title { font-size: 1.875rem; font-weight: 700; color: #f3f4f6; margin: 0; }
    .loading-container { display: flex; justify-content: center; padding: 4rem 0; }
    .form-card { background-color: #1f2937; border-radius: 12px; padding: 2rem; border: 1px solid #374151; }
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
    @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group--full { grid-column: 1 / -1; }
    .form-label { font-size: 0.875rem; font-weight: 500; color: #e5e7eb; }
    .required { color: #ef4444; }
    .form-hint { font-weight: 400; color: #6b7280; }
    .form-input { padding: 0.75rem 1rem; border: 1px solid #374151; border-radius: 8px; background-color: #111827; color: #e5e7eb; font-size: 0.9375rem; transition: border-color 0.2s; }
    .form-input::placeholder { color: #6b7280; }
    .form-input:focus { outline: none; border-color: #10b981; }
    .form-input--mono { font-family: monospace; }
    .form-input--error { border-color: #ef4444; }
    .form-textarea { resize: vertical; min-height: 100px; }
    .form-error { font-size: 0.75rem; color: #ef4444; }
    .form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #374151; }
    .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 500; font-size: 0.9375rem; cursor: pointer; border: none; text-decoration: none; transition: all 0.2s; }
    .btn svg { width: 18px; height: 18px; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn--primary { background-color: #10b981; color: white; }
    .btn--primary:hover:not(:disabled) { background-color: #059669; }
    .btn--secondary { background-color: #374151; color: #e5e7eb; }
    .btn--secondary:hover { background-color: #4b5563; }
  `]
})
export class ProductFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly notificationService = inject(NotificationService);

  categories = PRODUCT_CATEGORIES;
  productId = signal<number | null>(null);
  loading = signal(false);
  submitting = signal(false);
  isEditMode = computed(() => this.productId() !== null);

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    sku: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9\-]+$/)]],
    price: [null, [Validators.required, Validators.min(0.01)]],
    category: ['', Validators.required],
    description: ['', Validators.maxLength(500)]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) { this.productId.set(parseInt(id, 10)); this.loadProduct(); }
  }

  loadProduct(): void {
    const id = this.productId();
    if (!id) return;
    this.loading.set(true);
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.form.patchValue({ name: product.name, sku: product.sku, price: product.price, category: product.category, description: product.description || '' });
        this.loading.set(false);
      },
      error: () => { this.notificationService.error('No se pudo cargar el producto.'); this.router.navigate(['/products']); }
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return control ? control.invalid && control.touched : false;
  }

  onSkuInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.form.get('sku')?.setValue(input.value);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    const formValue = this.form.value;
    const request = { name: formValue.name.trim(), sku: formValue.sku.toUpperCase(), price: formValue.price, category: formValue.category, description: formValue.description?.trim() || null };
    const operation = this.isEditMode() ? this.productService.updateProduct(this.productId()!, request) : this.productService.createProduct(request);
    operation.subscribe({
      next: (product) => { this.notificationService.success(`"${product.name}" ${this.isEditMode() ? 'actualizado' : 'creado'}.`); this.router.navigate(['/products']); },
      error: () => { this.submitting.set(false); }
    });
  }
}