import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map, catchError, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth.service';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionGuard implements CanActivate {
  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    // First check if user is a scout
    const userType = this.authService.getUserType();
    if (userType !== 'scout') {
      return of(true);
    }

    // For scouts, check subscription status
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    return this.http.get<any>('http://localhost:8000/api/subscription/scout/status', { headers })
      .pipe(
        map(response => {
          if (response.subscription_active) {
            return true;
          }
          // If no active subscription, redirect to subscription page
          return this.router.createUrlTree(['/scout-subscription']);
        }),
        catchError(error => {
          console.error('Error checking subscription status:', error);
          // On error, redirect to subscription page
          return of(this.router.createUrlTree(['/scout-subscription']));
        })
      );
  }
}
