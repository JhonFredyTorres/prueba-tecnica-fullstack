import { Component, inject } from '@angular/core';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-notification-container',
  standalone: true,
  template: `
    <div class="notification-container">
      @for (notification of notificationService.notifications(); track notification.id) {
        <div class="notification notification--{{ notification.type }}" (click)="notificationService.dismiss(notification.id)">
          <span class="notification__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              @switch (notification.type) {
                @case ('success') { <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/> }
                @case ('error') { <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/> }
                @case ('warning') { <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/> }
                @default { <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/> }
              }
            </svg>
          </span>
          <span class="notification__message">{{ notification.message }}</span>
          <button class="notification__close" aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .notification-container { position: fixed; top: 1rem; right: 1rem; z-index: 9999; display: flex; flex-direction: column; gap: 0.75rem; max-width: 400px; }
    .notification { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem; border-radius: 8px; background-color: #1f2937; color: white; box-shadow: 0 10px 25px rgba(0,0,0,0.3); cursor: pointer; animation: slideIn 0.3s ease-out; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .notification--success { border-left: 4px solid #10b981; }
    .notification--error { border-left: 4px solid #ef4444; }
    .notification--warning { border-left: 4px solid #f59e0b; }
    .notification--info { border-left: 4px solid #3b82f6; }
    .notification__icon { flex-shrink: 0; width: 20px; height: 20px; }
    .notification__icon svg { width: 100%; height: 100%; }
    .notification--success .notification__icon { color: #10b981; }
    .notification--error .notification__icon { color: #ef4444; }
    .notification--warning .notification__icon { color: #f59e0b; }
    .notification--info .notification__icon { color: #3b82f6; }
    .notification__message { flex: 1; font-size: 0.875rem; line-height: 1.4; }
    .notification__close { flex-shrink: 0; width: 16px; height: 16px; padding: 0; border: none; background: none; color: #9ca3af; cursor: pointer; }
    .notification__close:hover { color: white; }
    .notification__close svg { width: 100%; height: 100%; }
  `]
})
export class NotificationContainerComponent {
  readonly notificationService = inject(NotificationService);
}