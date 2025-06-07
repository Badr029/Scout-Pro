import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../auth.service';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private location: Location
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    console.log('AdminGuard.canActivate called');
    const user = this.authService.getCurrentUser();
    console.log('Current user:', user);

    if (!user) {
      console.log('No user found, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }

    if (user.user_type === 'admin') {
      console.log('User is admin, allowing access');
      return true;
    }

    console.log('User is not admin, going back');
    this.location.back();
    return false;
  }
}
