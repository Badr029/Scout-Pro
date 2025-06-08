import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../auth.service';

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // If user is not logged in, allow access to public pages
    if (!this.authService.isLoggedIn()) {
      return true;
    }

    // If user is logged in, redirect them to the appropriate page
    const userType = this.authService.getUserType();
    const setupCompleted = this.authService.getSetupCompleted();

    console.log('GuestGuard: User is logged in, redirecting...', { userType, setupCompleted });

    if (userType === 'admin') {
      this.router.navigate(['/admin-dashboard']);
    } else if (!setupCompleted) {
      if (userType === 'player') {
        this.router.navigate(['/register-player']);
      } else if (userType === 'scout') {
        this.router.navigate(['/scout-register']);
      } else {
        // Fallback if user type is not recognized
        this.router.navigate(['/login']);
      }
    } else {
      // Setup is completed
      if (userType === 'scout') {
        // For scouts, check membership and redirect appropriately
        const membership = localStorage.getItem('membership');
        if (membership === 'premium') {
          this.router.navigate(['/home-feed']);
        } else {
          this.router.navigate(['/scout-subscription']);
        }
      } else if (userType === 'player') {
        this.router.navigate(['/home-feed']);
      } else {
        // Fallback for unknown user types
        this.router.navigate(['/home-feed']);
      }
    }

    return false; // Prevent access to the public page
  }
}
