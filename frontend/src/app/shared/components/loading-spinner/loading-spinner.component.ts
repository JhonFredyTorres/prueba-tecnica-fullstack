import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="spinner-wrapper" [class.spinner-wrapper--overlay]="overlay">
      <div class="spinner" [class]="'spinner--' + size">
        <svg viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        </svg>
      </div>
      @if (message) { <p class="spinner-message">{{ message }}</p> }
    </div>
  `,
  styles: [`
    .spinner-wrapper { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; padding: 2rem; }
    .spinner-wrapper--overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); z-index: 9998; }
    .spinner { color: #10b981; }
    .spinner--small { width: 20px; height: 20px; }
    .spinner--medium { width: 40px; height: 40px; }
    .spinner--large { width: 60px; height: 60px; }
    .spinner svg { width: 100%; height: 100%; animation: spin 1s linear infinite; }
    .spinner svg circle { stroke-dasharray: 90, 150; stroke-dashoffset: 0; animation: dash 1.5s ease-in-out infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    @keyframes dash { 0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; } 50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; } 100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; } }
    .spinner-message { color: white; font-size: 0.875rem; margin: 0; }
    .spinner-wrapper:not(.spinner-wrapper--overlay) .spinner-message { color: #6b7280; }
  `]
})
export class LoadingSpinnerComponent {
  @Input() overlay = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() message?: string;
}