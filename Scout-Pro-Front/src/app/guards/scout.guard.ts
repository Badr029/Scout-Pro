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

    // If not a scout, allow navigation
    if (userType !== 'scout') {
      return of(true);
    }

    // If trying to access subscription page, allow it
    if (state.url === '/scout-subscription') {
      return of(true);
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    return this.http.get('http://localhost:8000/api/subscription/scout/status', { headers })
      .pipe(
        map((response: any) => {
          if (response.subscription_active) {
            return true;
          } else {
            this.router.navigate(['/scout-subscription']);
            return false;
          }
        }),
        catchError(() => {
          this.router.navigate(['/scout-subscription']);
          return of(false);
        })
      );
  }
}
