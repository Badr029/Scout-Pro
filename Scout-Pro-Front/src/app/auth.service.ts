import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { SocialAuthService } from '@abacritt/angularx-social-login';

interface LoginResponse {
  message: string;
  access_token: string;
  token_type: string;
  user_type: 'player' | 'scout';
  setup_completed: boolean;
  needs_registration?: boolean;
  user_data?: any;
}

interface SocialLoginData {
  email: string;
  firstName: string;
  lastName: string;
  socialId: string;
  provider: string;
  idToken: string;
  user_type?: string;
}

interface RegisterData {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
  user_type: 'player' | 'scout';
}

interface ResetPasswordData {
  email: string;
  password: string;
  password_confirmation: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api';
  private tokenKey = 'auth_token';
  private userTypeKey = 'user_type';
  private setupCompletedKey = 'setup_completed';
  private isAuthenticated = new BehaviorSubject<boolean>(this.hasToken());
  private userTypeSubject = new BehaviorSubject<string | null>(localStorage.getItem('user_type'));
  private setupCompletedSubject = new BehaviorSubject<boolean>(localStorage.getItem('setup_completed') === 'true');

  constructor(
    private http: HttpClient,
    private router: Router,
    private socialAuthService: SocialAuthService
  ) {}

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated.value;
  }

  getUserType(): string | null {
    return localStorage.getItem(this.userTypeKey);
  }

  register(data: RegisterData): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data).pipe(
      tap((response: any) => {
        console.log('Registration response:', response);
        if (response.user_type) {
          localStorage.setItem(this.userTypeKey, response.user_type);
        }
      })
    );
  }

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        console.log('Login Response:', response);

        // First store the token and basic info
        this.setToken(response.access_token);
        this.setUserType(response.user_type);
        this.setSetupCompleted(response.setup_completed);

        // Store complete user data
        const userData = {
          id: response.user_data?.id,
          first_name: response.user_data?.first_name,
          last_name: response.user_data?.last_name,
          email: response.user_data?.email,
          user_type: response.user_type, // Use the user_type from the main response
          membership: response.user_data?.membership,
          profile_image: response.user_data?.profile_image
        };
        console.log('Storing user data:', userData);
        localStorage.setItem('user_data', JSON.stringify(userData));

        // Verify data was stored
        const storedUser = this.getCurrentUser();
        console.log('Stored user data:', storedUser);

        // Only redirect if we have valid user data
        if (storedUser && storedUser.user_type) {
          console.log('About to redirect with:', { userType: storedUser.user_type, setupCompleted: response.setup_completed });
          this.handleLoginRedirect(storedUser.user_type, response.setup_completed);
        } else {
          console.error('Failed to store user data properly');
        }
      })
    );
  }

  socialLogin(data: SocialLoginData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/google/callback`, data).pipe(
      tap((response) => {
        if (!response.needs_registration) {
          // Store the token and user type first
        this.setToken(response.access_token);
        this.setUserType(response.user_type);
        this.setSetupCompleted(response.setup_completed);

          // Store additional user data if available
          if (response.user_data) {
            localStorage.setItem('user_data', JSON.stringify({
              id: response.user_data.id,
              first_name: response.user_data.first_name,
              last_name: response.user_data.last_name,
              email: response.user_data.email,
              user_type: response.user_type,
              membership: response.user_data.membership,
              profile_image: response.user_data.profile_image
            }));
          }

          // Handle redirection after successful login
        this.handleLoginRedirect(response.user_type, response.setup_completed);
        }
      }),
      catchError(error => {
        console.error('Social login error:', error);
        return throwError(() => error);
      })
    );
  }

  sendPasswordResetLink(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(data: ResetPasswordData): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, data);
  }

  private clearAllStorageAndCookies(): void {
    // Clear localStorage
    localStorage.clear();

    // Clear sessionStorage
    sessionStorage.clear();

    // Clear all cookies
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=');
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
  }

  async logout(): Promise<void> {
    const token = localStorage.getItem('auth_token');
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;

    try {
      // First, try to sign out from Google if it's a Google account
      try {
        await this.socialAuthService.signOut(true);
        // Also try to revoke Google access
        const auth2 = await (window as any).gapi?.auth2?.getAuthInstance();
        if (auth2) {
          await auth2.disconnect();
        }
      } catch (error) {
        console.log('Not a Google account or Google sign-out failed');
      }

      // Then, call backend logout if we have a token
      if (headers) {
        await this.http.post<any>(`${this.apiUrl}/logout`, {}, { headers }).toPromise();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear storage and cookies, regardless of any errors
      this.clearAllStorageAndCookies();

      // Force reload the application to clear any remaining state
      window.location.href = '/login';
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.isAuthenticated.next(true);
  }

  private setUserType(userType: string): void {
    localStorage.setItem(this.userTypeKey, userType);
    this.userTypeSubject.next(userType);
  }

  getSetupCompleted(): boolean {
    return localStorage.getItem(this.setupCompletedKey) === 'true';
  }

  private setSetupCompleted(completed: boolean): void {
    localStorage.setItem(this.setupCompletedKey, completed.toString());
    this.setupCompletedSubject.next(completed);
  }

  handleLoginRedirect(userType: string, setupCompleted: boolean): void {
    console.log('handleLoginRedirect called with:', { userType, setupCompleted });

    // Double check user type
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.user_type !== userType) {
      console.error('User type mismatch or missing user data');
      return;
    }

    if (userType === 'admin') {
      console.log('Redirecting to admin dashboard');
      this.router.navigate(['/admin-dashboard']).then(
        success => console.log('Navigation result:', success),
        error => console.error('Navigation error:', error)
      );
    } else if (!setupCompleted) {
      if (userType === 'player') {
        this.router.navigate(['/register-player']);
      } else if (userType === 'scout') {
        this.router.navigate(['/scout-register']);
      }
    } else if (userType === 'scout') {
      // Check subscription status for scouts
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      });

      this.http.get('http://localhost:8000/api/subscription/scout/status', { headers })
        .subscribe({
          next: (response: any) => {
            localStorage.setItem('subscription_active', response.subscription_active.toString());
            if (response.subscription_active) {
              this.router.navigate(['/home-feed']);
            } else {
              this.router.navigate(['/scout-subscription']);
            }
          },
          error: () => {
            localStorage.setItem('subscription_active', 'false');
            this.router.navigate(['/scout-subscription']);
          }
        });
    } else {
      // For players
      this.router.navigate(['/home-feed']);
    }
  }

  getCurrentUser(): any {
    try {
      const userData = localStorage.getItem('user_data');
      if (!userData) {
        console.log('No user data found in localStorage');
        return null;
      }

      const parsedUserData = JSON.parse(userData);
      if (!parsedUserData || !parsedUserData.user_type) {
        console.log('Invalid user data structure:', parsedUserData);
        return null;
      }

      console.log('Retrieved user data:', parsedUserData);
      return parsedUserData;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Add new method to check subscription status
  checkScoutSubscriptionStatus(): Observable<boolean> {
    if (this.getUserType() !== 'scout') {
      return of(true);
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.get<any>('http://localhost:8000/api/subscription/scout/status', { headers })
      .pipe(
        map(response => {
          localStorage.setItem('subscription_active', response.subscription_active.toString());
          return response.subscription_active;
        }),
        catchError(() => {
          localStorage.setItem('subscription_active', 'false');
          return of(false);
        })
      );
  }
}
