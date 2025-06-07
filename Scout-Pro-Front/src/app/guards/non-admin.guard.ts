import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../auth.service';

@Injectable({
  providedIn: 'root'
})
export class NonAdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const user = this.authService.getCurrentUser();

    // Skip the guard for login-related routes
    const publicRoutes = ['login', 'register', 'forgot-password', 'reset-password'];
    if (publicRoutes.some(route => state.url.includes(route))) {
      return true;
    }

    if (user && user.user_type === 'admin') {
      // Only redirect if not already on admin dashboard
      if (!state.url.includes('admin-dashboard')) {
        this.router.navigate(['/admin-dashboard']);
        return false;
      }
    }

    return true;
  }
}
