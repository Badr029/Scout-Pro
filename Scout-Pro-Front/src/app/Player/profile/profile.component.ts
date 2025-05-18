import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface PlayerProfile {
  username: string;
  first_name: string;
  last_name: string;
  profile_image: string;
  DateofBirth: string;
  phone_number: string;
  height: number;
  weight: number;
  preferred_foot: string;
  position: string;
  secondary_position: string;
  gender: string;
  nationality: string;
  current_city: string;
  current_club: string;
  previous_clubs: string;
  playing_style: string;
  transfer_status: string;
  bio: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ProfileComponent implements OnInit {
  playerData: PlayerProfile | null = null;
  loading = true;
  error = '';
  activeTab = 'about';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.fetchPlayerProfile();
  }

  fetchPlayerProfile() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any>('http://localhost:8000/api/profile', { headers })
      .subscribe({
        next: (response) => {
          this.playerData = response.data;
          this.loading = false;
        },
        error: (error) => {
          this.error = error.error.message || 'Failed to load profile data';
          this.loading = false;
        }
      });
  }

  goToEditProfile() {
    this.router.navigate(['/edit-profile']);
  }

  goToLogin() {
    localStorage.removeItem('auth_token');
    this.router.navigate(['/login']);
  }

  switchTab(tab: string) {
    this.activeTab = tab;
  }

  calculateAge(dateOfBirth: string): number {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }
}

