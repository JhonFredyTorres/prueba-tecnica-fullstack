import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-state">
      <div class="empty-state__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          @switch (icon) {
            @case ('products') { <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/> }
            @case ('inventory') { <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/><path d="M9 12h6M9 16h6"/> }
            @default { <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/> }
          }
        </svg>
      </div>
      <h3 class="empty-state__title">{{ title }}</h3>
      @if (description) { <p class="empty-state__description">{{ description }}</p> }
      <div class="empty-state__action"><ng-content></ng-content></div>
    </div>
  `,
  styles: [`
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; }
    .empty-state__icon { width: 80px; height: 80px; color: #4b5563; margin-bottom: 1.5rem; }
    .empty-state__icon svg { width: 100%; height: 100%; }
    .empty-state__title { font-size: 1.25rem; font-weight: 600; color: #e5e7eb; margin: 0 0 0.5rem; }
    .empty-state__description { color: #9ca3af; margin: 0 0 1.5rem; max-width: 400px; }
    .empty-state__action { display: flex; gap: 0.75rem; }
  `]
})
export class EmptyStateComponent {
  @Input() icon: 'products' | 'inventory' | 'default' = 'default';
  @Input() title = 'No hay datos';
  @Input() description?: string;
}