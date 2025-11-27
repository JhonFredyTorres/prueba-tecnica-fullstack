import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  template: `
    @if (isOpen) {
      <div class="modal-overlay" (click)="onCancel()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal__icon" [class]="'modal__icon--' + type">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              @if (type === 'danger') {
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              } @else {
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              }
            </svg>
          </div>
          <h3 class="modal__title">{{ title }}</h3>
          <p class="modal__message">{{ message }}</p>
          <div class="modal__actions">
            <button class="btn btn--secondary" (click)="onCancel()">{{ cancelText }}</button>
            <button class="btn" [class.btn--danger]="type === 'danger'" [class.btn--primary]="type === 'info'" (click)="onConfirm()">{{ confirmText }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 9999; animation: fadeIn 0.2s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal { background-color: #1f2937; border-radius: 12px; padding: 2rem; max-width: 400px; width: 90%; text-align: center; animation: slideUp 0.3s ease-out; }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .modal__icon { width: 48px; height: 48px; margin: 0 auto 1rem; }
    .modal__icon svg { width: 100%; height: 100%; }
    .modal__icon--danger { color: #ef4444; }
    .modal__icon--info { color: #3b82f6; }
    .modal__title { font-size: 1.25rem; font-weight: 600; color: white; margin: 0 0 0.5rem; }
    .modal__message { color: #9ca3af; margin: 0 0 1.5rem; line-height: 1.5; }
    .modal__actions { display: flex; gap: 0.75rem; justify-content: center; }
    .btn { padding: 0.625rem 1.25rem; border-radius: 6px; font-weight: 500; font-size: 0.875rem; cursor: pointer; border: none; transition: all 0.2s; }
    .btn--secondary { background-color: #374151; color: white; }
    .btn--secondary:hover { background-color: #4b5563; }
    .btn--primary { background-color: #10b981; color: white; }
    .btn--primary:hover { background-color: #059669; }
    .btn--danger { background-color: #ef4444; color: white; }
    .btn--danger:hover { background-color: #dc2626; }
  `]
})
export class ConfirmModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirmar';
  @Input() message = '¿Estás seguro?';
  @Input() confirmText = 'Confirmar';
  @Input() cancelText = 'Cancelar';
  @Input() type: 'info' | 'danger' = 'info';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void { this.confirm.emit(); }
  onCancel(): void { this.cancel.emit(); }
}