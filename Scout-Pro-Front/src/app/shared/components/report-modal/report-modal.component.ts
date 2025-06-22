import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-report-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="report-modal-overlay">
      <div class="report-modal-content">
        <div class="report-modal-header">
          <h2>Report {{ type === 'bug' ? 'a Bug' : type === 'user' ? 'User' : 'Video' }}</h2>
          <span class="close" (click)="onClose()">&times;</span>
        </div>
        <div class="report-modal-body">
          <div class="form-group">
            <label for="reason">{{ type === 'bug' ? 'Severity' : 'Reason' }}</label>
            <select id="reason" [(ngModel)]="formData.reason" class="form-control">
              <option value="">Select {{ type === 'bug' ? 'severity level' : 'a reason' }}</option>
              <ng-container *ngIf="type === 'user'">
                <option value="spam">Spam</option>
                <option value="harassment">Harassment</option>
                <option value="inappropriate_behavior">Inappropriate Behavior</option>
                <option value="fake_profile">Fake Profile</option>
                <option value="bullying">Bullying</option>
                <option value="hate_speech">Hate Speech</option>
                <option value="scam_fraud">Scam/Fraud</option>
                <option value="impersonation">Impersonation</option>
                <option value="other">Other</option>
              </ng-container>
              <ng-container *ngIf="type === 'video'">
                <option value="copyright_violation">Copyright Violation</option>
                <option value="inappropriate_content">Inappropriate Content</option>
                <option value="spam">Spam</option>
                <option value="offensive_behavior">Offensive Behavior</option>
                <option value="other">Other</option>
              </ng-container>
              <ng-container *ngIf="type === 'bug'">
                <option value="feature">Feature Not Working</option>
                <option value="display">Display Issues</option>
                <option value="performance">Performance Issues</option>
                <option value="other">Other</option>
              </ng-container>
            </select>
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              [(ngModel)]="formData.description"
              class="form-control"
              rows="4"
              placeholder="Please provide more details...">
            </textarea>
          </div>

          <div *ngIf="type === 'bug'" class="form-group">
            <label>Browser Information</label>
            <p class="browser-info">{{ browserInfo }}</p>
          </div>

          <!-- Message Display -->
          <div *ngIf="message" class="message-container" [class.success]="messageType === 'success'" [class.error]="messageType === 'error'">
            <i class="fas" [class.fa-check-circle]="messageType === 'success'" [class.fa-exclamation-circle]="messageType === 'error'"></i>
            <span>{{ message }}</span>
          </div>
        </div>
        <div class="report-modal-footer">
          <button class="btn btn-outline" (click)="onClose()" [disabled]="submitting">Cancel</button>
          <button
            class="btn btn-primary"
            [disabled]="!formData.reason || !formData.description || submitting"
            (click)="onSubmit()">
            <span *ngIf="submitting">
              <i class="fas fa-spinner fa-spin"></i> Submitting...
            </span>
            <span *ngIf="!submitting">Submit Report</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    app-report-modal {
      display: contents !important;
    }

    app-report-modal .report-modal-overlay {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: rgba(0, 0, 0, 0.8) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 1050 !important;
    }

    app-report-modal .report-modal-content {
      background: var(--dark) !important;
      border-radius: 12px !important;
      width: 90% !important;
      max-width: 500px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
      color: var(--light) !important;
      position: relative !important;
      z-index: 1051 !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
    }

    app-report-modal .report-modal-header {
      padding: 1.25rem !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
    }

    app-report-modal .report-modal-header h2 {
      margin: 0 !important;
      color: var(--light) !important;
      font-size: 1.25rem !important;
      font-weight: 600 !important;
    }

    app-report-modal .report-modal-header .close {
      font-size: 1.5rem !important;
      color: var(--gray) !important;
      cursor: pointer !important;
      border: none !important;
      background: none !important;
      padding: 0 !important;
      transition: color 0.2s ease !important;
    }

    app-report-modal .report-modal-header .close:hover {
      color: var(--light) !important;
    }

    app-report-modal .report-modal-body {
      padding: 1.25rem !important;
    }

    app-report-modal .form-group {
      margin-bottom: 1.25rem !important;
    }

    app-report-modal .form-group label {
      display: block !important;
      margin-bottom: 0.5rem !important;
      color: var(--light) !important;
      font-weight: 500 !important;
    }

    app-report-modal .form-group .form-control {
      width: 100% !important;
      padding: 0.75rem !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      border-radius: 8px !important;
      background: var(--darker) !important;
      color: var(--light) !important;
      font-size: 0.95rem !important;
      transition: border-color 0.2s ease !important;
    }

    app-report-modal .form-group .form-control:focus {
      outline: none !important;
      border-color: var(--primary) !important;
      box-shadow: 0 0 0 2px rgba(38, 103, 204, 0.2) !important;
    }

    app-report-modal .form-group select.form-control {
      appearance: none !important;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 8.825L1.175 4 2.238 2.938 6 6.7l3.763-3.763L10.825 4z'/%3E%3C/svg%3E") !important;
      background-repeat: no-repeat !important;
      background-position: right 1rem center !important;
      padding-right: 2.5rem !important;
    }

    app-report-modal .form-group textarea.form-control {
      min-height: 100px !important;
      resize: vertical !important;
    }

    app-report-modal .browser-info {
      color: var(--gray) !important;
      font-size: 0.9rem !important;
      margin: 0 !important;
      padding: 0.75rem !important;
      background: var(--darker) !important;
      border-radius: 8px !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
    }

    app-report-modal .report-modal-footer {
      padding: 1.25rem !important;
      border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
      display: flex !important;
      justify-content: flex-end !important;
      gap: 0.75rem !important;
    }

    app-report-modal .btn {
      padding: 0.75rem 1.5rem !important;
      border-radius: 8px !important;
      font-weight: 600 !important;
      font-size: 0.95rem !important;
      transition: all 0.2s ease !important;
      cursor: pointer !important;
    }

    app-report-modal .btn-outline {
      background: transparent !important;
      border: 1px solid var(--gray) !important;
      color: var(--gray) !important;
    }

    app-report-modal .btn-outline:hover {
      border-color: var(--light) !important;
      color: var(--light) !important;
    }

    app-report-modal .btn-primary {
      background: var(--primary) !important;
      border: none !important;
      color: white !important;
    }

    app-report-modal .btn-primary:hover {
      background: var(--primary-dark) !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(38, 103, 204, 0.3) !important;
    }

    app-report-modal .btn-primary:disabled {
      opacity: 0.7 !important;
      cursor: not-allowed !important;
      transform: none !important;
      box-shadow: none !important;
    }

    app-report-modal .message-container {
      padding: 1rem !important;
      border-radius: 8px !important;
      margin-bottom: 1rem !important;
      display: flex !important;
      align-items: center !important;
      gap: 0.75rem !important;
      font-weight: 500 !important;
      animation: fadeIn 0.3s ease-in-out !important;
    }

    app-report-modal .message-container.success {
      background: rgba(34, 197, 94, 0.1) !important;
      border: 1px solid rgba(34, 197, 94, 0.3) !important;
      color: #22c55e !important;
    }

    app-report-modal .message-container.error {
      background: rgba(239, 68, 68, 0.1) !important;
      border: 1px solid rgba(239, 68, 68, 0.3) !important;
      color: #ef4444 !important;
    }

    app-report-modal .message-container i {
      font-size: 1.1rem !important;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    app-report-modal .fa-spinner {
      animation: spin 1s linear infinite !important;
    }

    @media (max-width: 768px) {
      app-report-modal .report-modal-content {
        width: 95% !important;
        margin: 1rem !important;
      }

      app-report-modal .report-modal-footer .btn {
        padding: 0.6rem 1.2rem !important;
      }
    }
  `]
})
export class ReportModalComponent {
  @Input() type: 'video' | 'user' | 'bug' = 'bug';
  @Input() itemId: number | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<any>();

  formData = {
    reason: '',
    description: ''
  };

  submitting = false;
  message = '';
  messageType: 'success' | 'error' | '' = '';

  get browserInfo(): string {
    return `${navigator.userAgent}`;
  }

  onClose() {
    this.close.emit();
  }

  onSubmit() {
    if (!this.formData.reason || !this.formData.description || this.submitting) return;

    this.submitting = true;
    this.message = '';
    this.messageType = '';

    const reportData = {
      type: this.type,
      item_id: this.itemId,
      reason: this.formData.reason,
      description: this.formData.description,
      browser_info: this.type === 'bug' ? JSON.stringify({
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        screen: {
          width: screen.width,
          height: screen.height,
          colorDepth: screen.colorDepth
        },
        window: {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight
        },
        url: window.location.href,
        timestamp: new Date().toISOString()
      }) : undefined
    };

    this.submit.emit(reportData);
  }

  showMessage(message: string, type: 'success' | 'error') {
    this.submitting = false;
    this.message = message;
    this.messageType = type;

    if (type === 'success') {
      // Auto-close after 2 seconds on success
      setTimeout(() => {
        this.close.emit();
      }, 2000);
    }
  }

  resetForm() {
    this.formData = {
      reason: '',
      description: ''
    };
    this.submitting = false;
    this.message = '';
    this.messageType = '';
  }
}
