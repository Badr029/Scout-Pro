import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScoutGuard implements CanActivate {
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

    // If not a scout, don't apply this guard
    if (userType !== 'scout') {
      return of(true);
    }

    // If already on subscription page, allow it
    if (state.url === '/scout-subscription') {
      return of(true);
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
            return true;
          } else {
            // If subscription is not active, redirect to subscription page
            this.router.navigate(['/scout-subscription']);
            return false;
          }
        }),
        catchError(() => {
          // On error, redirect to subscription page
          this.router.navigate(['/scout-subscription']);
          return of(false);
        })
      );
  }
}
