import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    const token = localStorage.getItem('auth_token');
    const userType = localStorage.getItem('user_type');

    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    // Check if setup is completed
    const setupCompleted = localStorage.getItem('setup_completed') === 'true';

    if (!setupCompleted) {
      // Redirect based on user type if setup is not completed
      if (userType === 'player') {
        if (state.url !== '/register-player') {
          this.router.navigate(['/register-player']);
          return false;
        }
      } else if (userType === 'scout') {
        if (state.url !== '/scout-register') {
          this.router.navigate(['/scout-register']);
          return false;
        }
      }
    }

    return true;
  }
}
