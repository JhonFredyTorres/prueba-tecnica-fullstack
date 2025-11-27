import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have title "Inventory System"', () => {
    expect(component.title).toBe('Inventory System');
  });

  describe('Layout', () => {
    it('should have sidebar', () => {
      const compiled = fixture.nativeElement;
      const sidebar = compiled.querySelector('.sidebar');
      expect(sidebar).toBeTruthy();
    });

    it('should have main content area', () => {
      const compiled = fixture.nativeElement;
      const mainContent = compiled.querySelector('.main-content');
      expect(mainContent).toBeTruthy();
    });

    it('should have router outlet', () => {
      const compiled = fixture.nativeElement;
      const routerOutlet = compiled.querySelector('router-outlet');
      expect(routerOutlet).toBeTruthy();
    });

    it('should have notification container', () => {
      const compiled = fixture.nativeElement;
      const notificationContainer = compiled.querySelector('app-notification-container');
      expect(notificationContainer).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should have Products link', () => {
      const compiled = fixture.nativeElement;
      const productsLink = compiled.querySelector('a[routerLink="/products"]');
      expect(productsLink).toBeTruthy();
      expect(productsLink.textContent).toContain('Productos');
    });

    it('should have Inventory link', () => {
      const compiled = fixture.nativeElement;
      const inventoryLink = compiled.querySelector('a[routerLink="/inventory"]');
      expect(inventoryLink).toBeTruthy();
      expect(inventoryLink.textContent).toContain('Inventario');
    });
  });

  describe('Sidebar', () => {
    it('should display logo with Inventory text', () => {
      const compiled = fixture.nativeElement;
      const logo = compiled.querySelector('.sidebar__logo');
      expect(logo).toBeTruthy();
      expect(logo.textContent).toContain('Inventory');
    });

    it('should display version number', () => {
      const compiled = fixture.nativeElement;
      const version = compiled.querySelector('.version');
      expect(version).toBeTruthy();
      expect(version.textContent).toContain('v1.0.0');
    });
  });
});