import { Injectable, signal, computed } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationsSignal = signal<Notification[]>([]);
  readonly notifications = this.notificationsSignal.asReadonly();
  readonly hasNotifications = computed(() => this.notificationsSignal().length > 0);

  private generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private addNotification(type: NotificationType, message: string, duration: number): void {
    const notification: Notification = { id: this.generateId(), type, message, duration };
    this.notificationsSignal.update(n => [...n, notification]);
    setTimeout(() => this.dismiss(notification.id), duration);
  }

  success(message: string, duration = 5000): void { this.addNotification('success', message, duration); }
  error(message: string, duration = 8000): void { this.addNotification('error', message, duration); }
  warning(message: string, duration = 6000): void { this.addNotification('warning', message, duration); }
  info(message: string, duration = 5000): void { this.addNotification('info', message, duration); }

  dismiss(id: string): void {
    this.notificationsSignal.update(n => n.filter(x => x.id !== id));
  }

  clear(): void { this.notificationsSignal.set([]); }
}