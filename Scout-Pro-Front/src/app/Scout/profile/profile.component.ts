import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  constructor(private router: Router) {}

  goToEditProfile() {
    this.router.navigate(['/Scout/profile/edit-profile']);
  }
}
