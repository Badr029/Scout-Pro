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
  styleUrls: ['./reset-password.component.css']
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

  onSubmit() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Validation
    if (!this.formData.password) {
      this.errorMessage = 'Password is required';
      this.loading = false;
      return;
    }

    if (this.formData.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long';
      this.loading = false;
      return;
    }

    if (this.formData.password !== this.formData.password_confirmation) {
      this.errorMessage = 'Passwords do not match';
      this.loading = false;
      return;
    }

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
