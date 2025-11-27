import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NotificationService, NotificationType } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    service.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should start with no notifications', () => {
      expect(service.notifications()).toEqual([]);
      expect(service.hasNotifications()).toBeFalse();
    });
  });

  describe('success()', () => {
    it('should add a success notification', () => {
      service.success('Operación exitosa');

      const notifications = service.notifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('success');
      expect(notifications[0].message).toBe('Operación exitosa');
    });

    it('should use default duration of 5000ms', fakeAsync(() => {
      service.success('Test message');
      expect(service.notifications().length).toBe(1);

      tick(4999);
      expect(service.notifications().length).toBe(1);

      tick(1);
      expect(service.notifications().length).toBe(0);
    }));

    it('should use custom duration when provided', fakeAsync(() => {
      service.success('Test message', 2000);
      expect(service.notifications().length).toBe(1);

      tick(1999);
      expect(service.notifications().length).toBe(1);

      tick(1);
      expect(service.notifications().length).toBe(0);
    }));
  });

  describe('error()', () => {
    it('should add an error notification', () => {
      service.error('Ha ocurrido un error');

      const notifications = service.notifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('error');
      expect(notifications[0].message).toBe('Ha ocurrido un error');
    });

    it('should use default duration of 8000ms', fakeAsync(() => {
      service.error('Error message');
      expect(service.notifications().length).toBe(1);

      tick(7999);
      expect(service.notifications().length).toBe(1);

      tick(1);
      expect(service.notifications().length).toBe(0);
    }));
  });

  describe('warning()', () => {
    it('should add a warning notification', () => {
      service.warning('Advertencia');

      const notifications = service.notifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('warning');
      expect(notifications[0].message).toBe('Advertencia');
    });

    it('should use default duration of 6000ms', fakeAsync(() => {
      service.warning('Warning message');
      expect(service.notifications().length).toBe(1);

      tick(5999);
      expect(service.notifications().length).toBe(1);

      tick(1);
      expect(service.notifications().length).toBe(0);
    }));
  });

  describe('info()', () => {
    it('should add an info notification', () => {
      service.info('Información importante');

      const notifications = service.notifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('info');
      expect(notifications[0].message).toBe('Información importante');
    });

    it('should use default duration of 5000ms', fakeAsync(() => {
      service.info('Info message');
      expect(service.notifications().length).toBe(1);

      tick(4999);
      expect(service.notifications().length).toBe(1);

      tick(1);
      expect(service.notifications().length).toBe(0);
    }));
  });

  describe('Multiple Notifications', () => {
    it('should handle multiple notifications', () => {
      service.success('Success 1');
      service.error('Error 1');
      service.warning('Warning 1');
      service.info('Info 1');

      expect(service.notifications().length).toBe(4);
      expect(service.hasNotifications()).toBeTrue();
    });

    it('should maintain order of notifications', () => {
      service.success('First');
      service.error('Second');
      service.warning('Third');

      const notifications = service.notifications();
      expect(notifications[0].message).toBe('First');
      expect(notifications[1].message).toBe('Second');
      expect(notifications[2].message).toBe('Third');
    });
  });

  describe('dismiss()', () => {
    it('should remove a specific notification by id', () => {
      service.success('Message 1');
      service.error('Message 2');
      service.warning('Message 3');

      const notifications = service.notifications();
      const idToRemove = notifications[1].id;

      service.dismiss(idToRemove);

      const remainingNotifications = service.notifications();
      expect(remainingNotifications.length).toBe(2);
      expect(remainingNotifications.find(n => n.id === idToRemove)).toBeUndefined();
    });

    it('should not throw when dismissing non-existent id', () => {
      service.success('Message 1');
      
      expect(() => service.dismiss('non-existent-id')).not.toThrow();
      expect(service.notifications().length).toBe(1);
    });
  });

  describe('clear()', () => {
    it('should remove all notifications', () => {
      service.success('Message 1');
      service.error('Message 2');
      service.warning('Message 3');
      service.info('Message 4');

      expect(service.notifications().length).toBe(4);

      service.clear();

      expect(service.notifications().length).toBe(0);
      expect(service.hasNotifications()).toBeFalse();
    });
  });

  describe('hasNotifications computed', () => {
    it('should return false when no notifications', () => {
      expect(service.hasNotifications()).toBeFalse();
    });

    it('should return true when there are notifications', () => {
      service.success('Test');
      expect(service.hasNotifications()).toBeTrue();
    });

    it('should update when notifications change', () => {
      expect(service.hasNotifications()).toBeFalse();
      
      service.success('Test');
      expect(service.hasNotifications()).toBeTrue();
      
      service.clear();
      expect(service.hasNotifications()).toBeFalse();
    });
  });

  describe('Notification ID Generation', () => {
    it('should generate unique ids for each notification', () => {
      service.success('Message 1');
      service.success('Message 2');
      service.success('Message 3');

      const notifications = service.notifications();
      const ids = notifications.map(n => n.id);
      const uniqueIds = [...new Set(ids)];

      expect(uniqueIds.length).toBe(3);
    });

    it('should generate ids with correct format', () => {
      service.success('Test');
      
      const notification = service.notifications()[0];
      expect(notification.id).toMatch(/^notification-\d+-[a-z0-9]+$/);
    });
  });
});