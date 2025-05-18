import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SocialAuthService, GoogleLoginProvider, GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleSigninButtonModule, RouterModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent {
  formData = {
    email: '',
    password: ''
  };

  loading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showUserTypeSelection = false;
  selectedUserType: 'player' | 'scout' | '' = '';
  pendingGoogleData: any = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private socialAuthService: SocialAuthService
  ) {
    this.socialAuthService.authState.subscribe((user) => {
      if (user) {
        this.handleSocialLogin(user);
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  selectUserType(type: 'player' | 'scout') {
    this.selectedUserType = type;
    if (this.pendingGoogleData) {
      this.completeSocialRegistration();
    }
  }

  login() {
    // Clear previous messages
    this.errorMessage = '';
    this.successMessage = '';

    // Client-side validation
    if (!this.formData.email?.trim()) {
      this.errorMessage = 'Email is required';
      return;
    }
    if (!this.isValidEmail(this.formData.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }
    if (!this.formData.password) {
      this.errorMessage = 'Password is required';
      return;
    }
    if (this.formData.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long';
      return;
    }

    this.loading = true;

    this.authService.login(this.formData).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = response.message || 'Login successful!';

        // Clear form
        this.formData = {
          email: '',
          password: ''
        };
      },
      error: (error) => {
        console.error('Login error:', error);
        this.loading = false;

        if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else if (error.error && typeof error.error === 'string') {
          this.errorMessage = error.error;
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
      }
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  loginWithGoogle() {
    this.loading = true;
    this.errorMessage = '';
    this.socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID).catch(error => {
      console.error('Google Sign-in error:', error);
      this.loading = false;
      this.errorMessage = 'Google Sign-in failed. Please try again.';
    });
  }

  private async handleSocialLogin(user: any) {
    try {
      this.loading = true;
      this.errorMessage = '';
      this.showUserTypeSelection = false; // Reset the selection modal
      this.pendingGoogleData = null; // Reset any pending data

      // Try to login first (without user_type)
      try {
        const loginResponse = await this.authService.socialLogin({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        socialId: user.id,
        provider: user.provider,
          idToken: user.idToken
      }).toPromise();

        // If we get here and have a needs_registration flag, show the selection
        if (loginResponse?.needs_registration) {
          this.showUserTypeSelection = true;
          this.pendingGoogleData = {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            socialId: user.id,
            provider: user.provider,
            idToken: user.idToken
          };
          this.errorMessage = 'Please select whether you want to register as a Player or Scout';
          return; // Stop here and wait for user selection
        }

        // If we get here, user exists and we can proceed with normal login
        this.handleLoginSuccess(loginResponse);
      } catch (error: any) {
        // Only handle errors that aren't related to needing registration
        if (!error.error?.needs_registration) {
          throw error;
        }
      }
    } catch (error: any) {
      this.handleLoginError(error);
    } finally {
      this.loading = false;
    }
  }

  private async completeSocialRegistration() {
    if (!this.selectedUserType || !this.pendingGoogleData) {
      this.errorMessage = 'Please select whether you want to register as a Player or Scout';
      return;
    }

    try {
      this.loading = true;
      this.errorMessage = '';

      // Now complete the registration with the selected user type
      const response = await this.authService.socialLogin({
        ...this.pendingGoogleData,
        user_type: this.selectedUserType
      }).toPromise();

      if (response && !response.needs_registration) {
        this.handleLoginSuccess(response);
        this.showUserTypeSelection = false;
        this.pendingGoogleData = null;
        this.selectedUserType = '';
      }
    } catch (error: any) {
      this.handleLoginError(error);
    } finally {
      this.loading = false;
    }
  }

  private handleLoginSuccess(response: any) {
    if (response && response.access_token) {
      localStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('user_type', response.user_type);
      localStorage.setItem('setup_completed', response.setup_completed.toString());

      if (!response.setup_completed) {
        this.router.navigate([`/${response.user_type}-register`]);
      } else {
        this.router.navigate(['/home-feed']);
      }
    }
  }

  private handleLoginError(error: any) {
    console.error('Login error:', error);
      if (error.error?.message) {
        this.errorMessage = error.error.message;
      } else if (error.error && typeof error.error === 'string') {
        this.errorMessage = error.error;
      } else {
      this.errorMessage = 'Login failed. Please try again.';
    }
  }
}
