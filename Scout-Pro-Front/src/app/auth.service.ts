import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
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
        this.setToken(response.access_token);
        this.setUserType(response.user_type);
        this.setSetupCompleted(response.setup_completed);
        this.handleLoginRedirect(response.user_type, response.setup_completed);
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
            localStorage.setItem('user_data', JSON.stringify(response.user_data));
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
    if (!setupCompleted) {
      if (userType === 'player') {
        this.router.navigate(['/register-player']);
      } else if (userType === 'scout') {
        this.router.navigate(['/scout-register']);
      }
    } else {
      this.router.navigate(['/home-feed']);
    }
  }
}
