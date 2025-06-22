import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-report-modal',
  templateUrl: './report-modal.component.html',
  styleUrls: ['./report-modal.component.css']
})
export class ReportModalComponent implements OnInit {
  @Input() type: 'video' | 'user' | 'bug' = 'video';
  @Input() itemId: number | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<any>();

  reportForm: FormGroup;
  submitting = false;

  reasonOptions = {
    video: [
      { value: 'copyright', label: 'Copyright Violation' },
      { value: 'inappropriate', label: 'Inappropriate Content' },
      { value: 'spam', label: 'Spam' },
      { value: 'other', label: 'Other' }
    ],
    user: [
      { value: 'spam', label: 'Spam' },
      { value: 'harassment', label: 'Harassment' },
      { value: 'inappropriate', label: 'Inappropriate Behavior' },
      { value: 'impersonation', label: 'Impersonation' },
      { value: 'other', label: 'Other' }
    ],
    bug: [
      { value: 'feature', label: 'Feature Issue' },
      { value: 'display', label: 'Display Problem' },
      { value: 'performance', label: 'Performance Issue' },
      { value: 'other', label: 'Other' }
    ]
  };

  constructor(private fb: FormBuilder) {
    this.reportForm = this.fb.group({
      reason: ['', Validators.required],
      description: ['', [Validators.required, Validators.maxLength(1000)]],
      browser_info: ['']
    });
  }

  ngOnInit() {
    if (this.type === 'bug') {
      this.reportForm.patchValue({
        browser_info: JSON.stringify({
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
        })
      });
    }
  }

  onSubmit() {
    if (this.reportForm.invalid) return;

    this.submitting = true;
    const formData = {
      ...this.reportForm.value,
      [this.type === 'video' ? 'video_id' : this.type === 'user' ? 'user_id' : 'page_url']: this.itemId || window.location.href
    };

    this.submit.emit(formData);
  }

  onClose() {
    this.close.emit();
  }
}
