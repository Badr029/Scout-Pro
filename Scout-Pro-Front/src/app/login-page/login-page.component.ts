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
  styleUrls: [
    './login-page.component.css',
    '../shared/styles/auth-background.scss'
  ]
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
  isAdminLogin = false;
  rememberMe = false;

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

  hideUserTypeSelection() {
    this.showUserTypeSelection = false;
    this.pendingGoogleData = null;
    this.selectedUserType = '';
    this.errorMessage = '';
  }

  login() {
    this.errorMessage = '';
    this.successMessage = '';

    // Basic validation
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

    // Check if this might be an admin login attempt
    const possibleAdminEmails = ['admin@scoutpro.com', 'manager@scoutpro.com', 'moderator@scoutpro.com'];
    const isLikelyAdmin = possibleAdminEmails.includes(this.formData.email.toLowerCase()) ||
                          this.formData.email.toLowerCase().includes('admin');

    console.log('Login attempt debug:', {
      email: this.formData.email,
      isLikelyAdmin,
      possibleAdminEmails,
      emailLower: this.formData.email.toLowerCase()
    });

    // FOR TESTING: Force admin login for admin@scoutpro.com
    if (this.formData.email.toLowerCase() === 'admin@scoutpro.com') {
      console.log('FORCING ADMIN LOGIN');
      this.testAdminLogin();
      return;
    }

    if (isLikelyAdmin) {
      // Try admin login first
      this.authService.adminLogin(this.formData).subscribe({
        next: (response) => {
          console.log('Admin login response:', response);
          this.loading = false;
          this.successMessage = response.message || 'Admin login successful!';

          // Clear form
          this.formData = {
            email: '',
            password: ''
          };
        },
        error: (error) => {
          console.error('Admin login failed:', error);
          this.loading = false;

          // Show admin-specific error, don't fallback to regular login
          if (error.error?.message) {
            this.errorMessage = error.error.message;
          } else if (error.error && typeof error.error === 'string') {
            this.errorMessage = error.error;
          } else {
            this.errorMessage = 'Admin login failed. Please check your credentials.';
          }
        }
      });
    } else {
      // Try regular login
      this.tryRegularLogin();
    }
  }

  // Temporary test method
  private testAdminLogin() {
    console.log('Testing admin login directly...');
    this.authService.adminLogin(this.formData).subscribe({
      next: (response) => {
        console.log('DIRECT ADMIN LOGIN SUCCESS:', response);
        this.loading = false;
        this.successMessage = 'Admin login successful!';
        this.formData = { email: '', password: '' };
      },
      error: (error) => {
        console.error('DIRECT ADMIN LOGIN ERROR:', error);
        this.loading = false;
        this.errorMessage = `Admin login failed: ${error.error?.message || error.message || 'Unknown error'}`;
      }
    });
  }

  private tryRegularLogin() {
    // Move any existing tokens to session storage if they exist in local storage
    const existingToken = localStorage.getItem('auth_token');
    if (existingToken) {
      sessionStorage.setItem('auth_token', existingToken);
      localStorage.removeItem('auth_token');
    }

    this.authService.login(this.formData).subscribe({
      next: (response) => {
        console.log('Login response:', response);
        this.loading = false;
        this.successMessage = response.message || 'Login successful!';

        // Store token based on remember me preference
        if (this.rememberMe) {
          localStorage.setItem('auth_token', response.access_token);
        } else {
          sessionStorage.setItem('auth_token', response.access_token);
        }

        // Clear form
        this.formData = {
          email: '',
          password: ''
        };

        // Don't let auth service handle redirect - do it here explicitly
        this.handleLoginRedirect(response);
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
      this.showUserTypeSelection = false;
      this.pendingGoogleData = null;

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

        // If we get here, user exists and we can proceed with login
        this.handleLoginRedirect(loginResponse);
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
        this.handleLoginRedirect(response);
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

  private handleLoginRedirect(response: any) {
    console.log('Handling login redirect with response:', response);
    console.log('Response type:', typeof response);
    console.log('Response keys:', Object.keys(response || {}));
    console.log('Access token:', response?.access_token);
    console.log('User type:', response?.user_type);
    console.log('Setup completed:', response?.setup_completed);
    console.log('User data:', response?.user_data);

    if (!response) {
      console.error('No response provided');
      this.errorMessage = 'Invalid login response. Please try again.';
      return;
    }

    if (!response.access_token) {
      console.error('No access token in response:', response);
      this.errorMessage = 'Invalid login response. Please try again.';
      return;
    }

    // Store auth data
    localStorage.setItem('auth_token', response.access_token);
    localStorage.setItem('user_type', response.user_type);
    localStorage.setItem('setup_completed', response.setup_completed?.toString() || 'false');

    if (response.user_data) {
      localStorage.setItem('user_data', JSON.stringify(response.user_data));
      localStorage.setItem('membership', response.user_data.membership || 'free');
    }

    const setupCompleted = response.setup_completed ?? false;
    const userType = response.user_type;

    console.log('Redirect logic:', { userType, setupCompleted });

    // Handle redirection based on user type and setup status
    if (userType === 'admin') {
      this.router.navigate(['/admin-dashboard']);
    } else if (!setupCompleted) {
      if (userType === 'player') {
        this.router.navigate(['/register-player']);
      } else if (userType === 'scout') {
        this.router.navigate(['/scout-register']);
      } else {
        console.error('Unknown user type:', userType);
        this.errorMessage = 'Invalid user type. Please try again.';
      }
    } else {
      // Setup is completed
      if (userType === 'scout') {
        // Check if scout has active subscription
        const membership = response.user_data?.membership;
        if (membership === 'premium') {
          this.router.navigate(['/home-feed']);
        } else {
          this.router.navigate(['/scout-subscription']);
        }
      } else if (userType === 'player') {
        this.router.navigate(['/home-feed']);
      } else {
        console.error('Unknown user type for completed setup:', userType);
        this.router.navigate(['/home-feed']); // Default fallback
      }
    }
  }

  private handleLoginSuccess(response: any) {
    // This method is kept for backward compatibility but now redirects to handleLoginRedirect
    this.handleLoginRedirect(response);
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
