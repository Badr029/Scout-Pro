import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: [
    './reset-password.component.css',
    '../shared/styles/auth-background.scss'
  ]
})
export class ResetPasswordComponent implements OnInit {
  formData = {
    email: '',
    password: '',
    password_confirmation: '',
    token: ''
  };

  loading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  validationErrors: { [key: string]: string[] } = {
    password: [],
    password_confirmation: []
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get token and email from URL query parameters
    this.route.queryParams.subscribe(params => {
      this.formData.token = params['token'] || '';
      this.formData.email = decodeURIComponent(params['email'] || '');

      // If no token or email, redirect to forgot password
      if (!this.formData.token || !this.formData.email) {
        this.router.navigate(['/forgot-password']);
      }
    });
  }

  togglePasswordVisibility(field: 'password' | 'confirm') {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  validatePassword(password: string): string[] {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (password.length > 64) {
      errors.push('Password cannot exceed 64 characters');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }

    return errors;
  }

  onPasswordChange() {
    this.validationErrors['password'] = this.validatePassword(this.formData.password);
    this.validatePasswordMatch();
  }

  onConfirmPasswordChange() {
    this.validatePasswordMatch();
    }

  validatePasswordMatch() {
    if (this.formData.password_confirmation && this.formData.password !== this.formData.password_confirmation) {
      this.validationErrors['password_confirmation'] = ['Passwords do not match'];
    } else {
      this.validationErrors['password_confirmation'] = [];
    }
  }

  onSubmit() {
    // Validate password before submission
    const passwordErrors = this.validatePassword(this.formData.password);
    if (passwordErrors.length > 0) {
      this.validationErrors['password'] = passwordErrors;
      return;
    }

    // Validate password match
    this.validatePasswordMatch();
    if (this.validationErrors['password_confirmation'].length > 0) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.resetPassword(this.formData).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = response.message || 'Password has been reset successfully!';

        // Clear form
        this.formData = {
          email: '',
          password: '',
          password_confirmation: '',
          token: ''
        };

        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.loading = false;
        if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Failed to reset password. Please try again.';
        }
      }
    });
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }
}
