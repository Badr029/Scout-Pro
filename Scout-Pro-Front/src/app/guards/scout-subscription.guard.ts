import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScoutSubscriptionGuard implements CanActivate {
  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Get user type from localStorage
    const userType = localStorage.getItem('user_type');

    // Only apply this guard for scouts
    if (userType !== 'scout') {
      this.router.navigate(['/']);
      return of(false);
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    return this.http.get('http://localhost:8000/api/subscription/scout/status', { headers })
      .pipe(
        map((response: any) => {
          // Check if subscription is active (1) or inactive (0)
          const isActive = response.data?.active === true || response.subscription_active === true;
          if (isActive) {
            // If subscription is active and trying to access subscription page,
            // redirect to home-feed
            if (state.url === '/scout-subscription') {
              this.router.navigate(['/home-feed']);
              return false;
            }
            return true;
          } else {
            // If subscription is not active, only allow access to subscription page
            if (state.url !== '/scout-subscription') {
              this.router.navigate(['/scout-subscription']);
            return false;
            }
            return true;
          }
        }),
        catchError(() => {
          // On error, allow access to subscription page only
          if (state.url !== '/scout-subscription') {
            this.router.navigate(['/scout-subscription']);
          return of(false);
          }
          return of(true);
        })
      );
  }
}
