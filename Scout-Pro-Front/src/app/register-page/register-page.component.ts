import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SocialAuthService, GoogleLoginProvider, SocialUser, GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
import { AuthService } from '../auth.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

interface RegisterFormData {
  user_type: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleSigninButtonModule],
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class RegisterPageComponent {
  formData: RegisterFormData = {
    user_type: '',
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  loading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  socialUserType: 'player' | 'scout' | '' = '';
  validationErrors: { [key: string]: string[] } = {};

  constructor(
    private router: Router,
    private authService: AuthService,
    private socialAuthService: SocialAuthService,
    private http: HttpClient
  ) {
    // Reset user type on component initialization
    this.resetUserType();

    this.socialAuthService.authState.subscribe((user: SocialUser) => {
      if (user) {
        this.handleSocialLogin(user);
      }
    });
  }

  // Add method to reset user type
  private resetUserType() {
    this.formData.user_type = '';
    this.socialUserType = '';
  }

  selectUserType(type: 'player' | 'scout') {
    this.formData.user_type = type;
    this.socialUserType = type;
    this.errorMessage = '';
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit() {
    // Reset messages and errors
    this.errorMessage = '';
    this.successMessage = '';
    this.validationErrors = {};
    this.loading = true;

    // Create API request data with password_confirmation
    const apiData = {
      ...this.formData,
      password_confirmation: this.formData.confirmPassword
    };

    this.http.post('http://localhost:8000/api/register', apiData)
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          this.successMessage = 'Registration successful! Check Email for verification! Redirecting to login...';

          // Clear form
          this.formData = {
            user_type: '',
            first_name: '',
            last_name: '',
            username: '',
            email: '',
            password: '',
            confirmPassword: ''
          };

          // Redirect to login after success
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          if (error.status === 400 && error.error?.errors) {
            this.validationErrors = error.error.errors;
            // Get the first error message for display
            const firstError = Object.values(error.error.errors)[0];
            this.errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          } else if (error.error?.message) {
            this.errorMessage = error.error.message;
          } else {
            this.errorMessage = 'Registration failed. Please try again.';
          }
        }
      });
  }

  // Validation methods
  validateField(field: string): boolean {
    const value = this.formData[field as keyof RegisterFormData];

    switch (field) {
      case 'user_type':
        return !!value && ['player', 'scout'].includes(value);
      case 'first_name':
      case 'last_name':
      case 'username':
        return !!value && value.length <= 255;
      case 'email':
        return !!value && this.validateEmail(value) && value.length <= 255;
      case 'password':
        return !!value && value.length >= 6;
      case 'confirmPassword':
        return !!value && value === this.formData.password;
      default:
        return true;
    }
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  getFieldError(field: string): string {
    if (this.validationErrors[field]) {
      return this.validationErrors[field][0];
    }
    return '';
  }

  hasFieldError(field: string): boolean {
    return !!this.validationErrors[field];
  }

  async registerWithGoogle() {
    try {
      if (!this.socialUserType) {
        this.errorMessage = 'Please select whether you want to register as a Player or Scout';
        return;
      }

      this.loading = true;
      this.errorMessage = '';
      await this.socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID);
    } catch (error) {
      this.loading = false;
      this.errorMessage = 'Google Sign-in failed. Please try again.';
      console.error('Google Sign-in error:', error);
    }
  }

  private async handleSocialLogin(user: SocialUser) {
    try {
      if (!this.formData.user_type && !this.socialUserType) {
        this.errorMessage = 'Please select whether you want to register as a Player or Scout';
        return;
      }

      this.loading = true;
      this.errorMessage = '';
      console.log('Social login user data:', user);

      const selectedType = this.formData.user_type || this.socialUserType;

      const response = await this.authService.socialLogin({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        socialId: user.id,
        provider: user.provider,
        idToken: user.idToken,
        user_type: selectedType
      }).toPromise();

      if (response) {
        this.successMessage = 'Successfully registered with Google!';

        // Store the token and user type
        localStorage.setItem('auth_token', response.access_token);
        localStorage.setItem('user_type', response.user_type);
        localStorage.setItem('setup_completed', response.setup_completed.toString());

        // Reset user type after successful registration
        this.resetUserType();

        // Redirect based on setup completion
        setTimeout(() => {
          if (response.setup_completed) {
            this.router.navigate(['/home-feed']);
          } else {
            this.router.navigate([`/${response.user_type}-register`]);
          }
        }, 1500);
      }
    } catch (error: any) {
      console.error('Social login error:', error);
      if (error.error && error.error.message) {
        this.errorMessage = error.error.message;
      } else if (error.error && typeof error.error === 'string') {
        this.errorMessage = error.error;
      } else if (error.message) {
        this.errorMessage = error.message;
      } else {
        this.errorMessage = 'Registration with Google failed. Please try again.';
      }
      // Reset user type on error as well
      this.resetUserType();
    } finally {
      this.loading = false;
    }
  }
}
