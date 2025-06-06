import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" [class.show]="isOpen" (click)="closeOnOverlay($event)">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 *ngIf="title">{{ title }}</h2>
          <button class="close-btn" (click)="onClose()">×</button>
        </div>
        <div class="modal-content">
          <ng-content></ng-content>
        </div>
        <div class="modal-footer" *ngIf="hasFooter">
          <ng-content select="[footer]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #242424;
      z-index: 1000;
      justify-content: center;
      align-items: center;
    }

    .modal-overlay.show {
      display: flex;
    }

    .modal-container {
      background: #242424;
      border-radius: 8px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      animation: modalFadeIn 0.3s ease-out;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid var(--border);
    }

    .modal-header h2 {
      margin: 0;
      color: var(--text-primary);
      font-size: 1.25rem;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 0.5rem;
      line-height: 1;
      transition: color 0.2s;
    }

    .close-btn:hover {
      color: var(--text-primary);
    }

    .modal-content {
      padding: 1rem;
      background-color: #242424;
      color: var(--text-primary);
    }

    .modal-footer {
      padding: 1rem;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }

    @keyframes modalFadeIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class ModalComponent {
  @Input() id?: string;
  @Input() title?: string;
  @Output() closeModal = new EventEmitter<void>();

  constructor(private modalService: ModalService) {}

  get isOpen(): boolean {
    return this.modalService.isOpen(this.id || '');
  }

  get hasFooter(): boolean {
    return !!document.querySelector('[footer]');
  }

  onClose(): void {
    this.modalService.close();
    this.closeModal.emit();
  }

  closeOnOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onClose();
    }
  }
}
