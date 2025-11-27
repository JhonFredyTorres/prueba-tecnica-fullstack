import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { PaginationMeta } from '@core/models';

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    @if (meta && meta.totalPages > 1) {
      <div class="pagination">
        <div class="pagination__info">Mostrando {{ startItem() }} - {{ endItem() }} de {{ meta.totalElements }}</div>
        <div class="pagination__controls">
          <button class="pagination__btn" [disabled]="meta.currentPage === 0" (click)="goToPage(meta.currentPage - 1)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          @for (page of visiblePages(); track $index) {
            @if (page === '...') { <span class="pagination__ellipsis">...</span> }
            @else {
              <button class="pagination__btn pagination__btn--number" [class.pagination__btn--active]="page === meta.currentPage" (click)="goToPage(+page)">{{ +page + 1 }}</button>
            }
          }
          <button class="pagination__btn" [disabled]="meta.currentPage === meta.totalPages - 1" (click)="goToPage(meta.currentPage + 1)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .pagination { display: flex; align-items: center; justify-content: space-between; padding: 1rem 0; flex-wrap: wrap; gap: 1rem; }
    .pagination__info { font-size: 0.875rem; color: #9ca3af; }
    .pagination__controls { display: flex; align-items: center; gap: 0.25rem; }
    .pagination__btn { display: flex; align-items: center; justify-content: center; min-width: 36px; height: 36px; padding: 0 0.5rem; border: 1px solid #374151; border-radius: 6px; background-color: transparent; color: #e5e7eb; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; }
    .pagination__btn svg { width: 16px; height: 16px; }
    .pagination__btn:hover:not(:disabled) { background-color: #374151; border-color: #4b5563; }
    .pagination__btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .pagination__btn--active { background-color: #10b981; border-color: #10b981; color: white; }
    .pagination__btn--active:hover { background-color: #059669; border-color: #059669; }
    .pagination__ellipsis { padding: 0 0.5rem; color: #6b7280; }
  `]
})
export class PaginationComponent {
  @Input() meta!: PaginationMeta;
  @Output() pageChange = new EventEmitter<number>();

  startItem = computed(() => this.meta ? this.meta.currentPage * this.meta.pageSize + 1 : 0);
  endItem = computed(() => {
    if (!this.meta) return 0;
    return Math.min((this.meta.currentPage + 1) * this.meta.pageSize, this.meta.totalElements);
  });

  visiblePages = computed<(number | string)[]>(() => {
    if (!this.meta) return [];
    const total = this.meta.totalPages;
    const current = this.meta.currentPage;
    const pages: (number | string)[] = [];
    if (total <= 7) { for (let i = 0; i < total; i++) pages.push(i); return pages; }
    pages.push(0);
    if (current > 3) pages.push('...');
    for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) if (!pages.includes(i)) pages.push(i);
    if (current < total - 4) pages.push('...');
    if (!pages.includes(total - 1)) pages.push(total - 1);
    return pages;
  });

  goToPage(page: number): void {
    if (page >= 0 && page < this.meta.totalPages && page !== this.meta.currentPage) this.pageChange.emit(page);
  }
}