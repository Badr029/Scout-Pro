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
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    return this.http.get('http://localhost:8000/api/subscription/scout/status', { headers })
      .pipe(
        map((response: any) => {
          if (response.subscription_active) {
            return true;
          } else {
            // If not on subscription page, redirect to it
            if (!state.url.includes('/subscription')) {
              this.router.navigate(['/subscription']);
            }
            return false;
          }
        }),
        catchError(() => {
          // On error, redirect to subscription page
          if (!state.url.includes('/subscription')) {
            this.router.navigate(['/subscription']);
          }
          return of(false);
        })
      );
  }
}
