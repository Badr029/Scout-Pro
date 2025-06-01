import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: [
    './forgot-password.component.css',
    '../shared/styles/auth-background.css'
  ]
})
export class ForgotPasswordComponent {
  email: string = '';
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email?.trim()) {
      this.errorMessage = 'Email is required';
      this.loading = false;
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.errorMessage = 'Please enter a valid email address';
      this.loading = false;
      return;
    }

    this.authService.sendPasswordResetLink(this.email).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = response.message;
        this.email = '';
      },
      error: (error) => {
        this.loading = false;
        if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Failed to send reset link. Please try again.';
        }
      }
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }
}
