import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    const userType = this.authService.getUserType();
    const setupCompleted = this.authService.getSetupCompleted();
    const url = state.url;

    // If setup is not completed, redirect to appropriate registration
    if (!setupCompleted && !this.isRegistrationRoute(url)) {
      if (userType === 'player') {
        this.router.navigate(['/register-player']);
        return false;
      } else if (userType === 'scout') {
        this.router.navigate(['/scout-register']);
        return false;
      }
    }

    // If setup is completed and trying to access registration pages, redirect to home
    if (setupCompleted && this.isRegistrationRoute(url)) {
      this.router.navigate(['/home-feed']);
      return false;
    }

    return true;
  }

  private isRegistrationRoute(url: string): boolean {
    return url === '/register-player' || url === '/scout-register';
  }
}
