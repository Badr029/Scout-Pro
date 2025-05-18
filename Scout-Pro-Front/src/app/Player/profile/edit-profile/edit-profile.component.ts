import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-edit-profile',
  imports: [],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.css',
  encapsulation: ViewEncapsulation.None

})
export class EditProfileComponent {
  constructor(private router: Router) {}

  goToProfile() {
    this.router.navigate(['/profile']);
  }
}
