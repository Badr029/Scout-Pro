import { Component, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';

interface ScoutProfile {
  username: string;
  first_name: string;
  last_name: string;
  profile_image: string;
  city: string;
  country: string;
  contact_email: string;
  contact_phone: string;
  organization: string;
  position_title: string;
  scouting_regions: string;
  age_groups: string[];
  preferred_roles: string;
  clubs_worked_with: string;
  linkedin_url?: string;
  id_proof: string;
  certifications: string[];
  registration_type?: string; // 'email' or 'google'
}

interface ContactedPlayer {
  id: number;
  player_name: string;
  contact_date: string;
  status: string; // 'contacted', 'idle', 'in_discussion', etc.
  player_profile_url: string;
}

@Component({
  selector: 'app-scout-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ScoutProfileComponent implements OnInit, OnDestroy {
  scoutData: ScoutProfile | null = null;
  loading = true;
  error = '';
  activeTab = 'about';
  contactedPlayers: ContactedPlayer[] = [];
  showDeleteConfirm = false;
  deletePassword = '';
  deleteConfirmation = '';
  deleteError = '';
  isGoogleAccount = false;
  showSettingsMenu = false;
  Array = Array;

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    console.log('Scout Profile component initialized');
    this.fetchScoutProfile();
    this.fetchContactedPlayers();

    window.addEventListener('DOMContentLoaded', () => {
      console.log('DOM fully loaded - UI will update automatically through Angular bindings');
    });

    setTimeout(() => {
      console.log('Safety timeout - ensuring UI is updated');
    }, 1000);
  }

  fetchScoutProfile() {
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
          console.log('Profile response:', response);

          this.scoutData = response.data;

          if (this.scoutData) {
            if (response.data.registration_type === 'google') {
              this.isGoogleAccount = true;
              console.log('This is a Google account');
            } else {
              this.isGoogleAccount = false;
            }

            if (!this.scoutData.profile_image || (
                this.scoutData.profile_image &&
                !this.scoutData.profile_image.startsWith('http') &&
                !this.scoutData.profile_image.includes('storage/'))) {
              if (response.data.user?.profile_image) {
                this.scoutData.profile_image = response.data.user.profile_image;
              }
            }

            this.normalizeProfileData();
            console.log('Profile data normalized, UI will update automatically');
          }

          this.loading = false;
        },
        error: (error) => {
          this.error = error.error.message || 'Failed to load profile data';
          this.loading = false;
          console.error('Profile fetch error:', error);
        }
      });
  }

  fetchContactedPlayers() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.contactedPlayers = [];
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any>('http://localhost:8000/api/scout/contacted-players', { headers })
      .subscribe({
        next: (response) => {
          console.log('Contacted players response:', response);
          if (response && response.data && Array.isArray(response.data)) {
            this.contactedPlayers = response.data;
          } else {
            this.contactedPlayers = [];
          }
        },
        error: (error) => {
          console.error('Failed to load contacted players', error);
          this.contactedPlayers = [];
        }
      });
  }

  goToEditProfile() {
    this.router.navigate(['/scout/edit-profile']);
  }

  async logout() {
    await this.authService.logout();
  }

  showDeleteAccountModal() {
    this.showDeleteConfirm = true;
    this.deletePassword = '';
    this.deleteError = '';
  }

  hideDeleteAccountModal() {
    this.showDeleteConfirm = false;
  }

  deleteAccount() {
    if (this.isGoogleAccount) {
      if (this.deleteConfirmation.toLowerCase() !== 'delete') {
        this.deleteError = 'Please type "delete" to confirm';
        return;
      }
    } else {
      if (!this.deletePassword) {
        this.deleteError = 'Please enter your password';
        return;
      }
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const requestData = this.isGoogleAccount ? {} : { password: this.deletePassword };

    this.http.delete<any>('http://localhost:8000/api/account', { headers, body: requestData })
      .subscribe({
        next: () => {
          localStorage.removeItem('auth_token');
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.deleteError = error.error.message || 'Failed to delete account';
          if (error.status === 404) {
            this.tryBackupDelete(headers, requestData);
          }
        }
      });
  }

  tryBackupDelete(headers: HttpHeaders, requestData: any) {
    this.http.post<any>('http://localhost:8000/api/account/delete', requestData, { headers })
      .subscribe({
        next: () => {
          localStorage.removeItem('auth_token');
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.deleteError = error.error.message || 'Failed to delete account';
        }
      });
  }

  switchTab(tab: string) {
    this.activeTab = tab;
  }

  normalizeProfileData() {
    if (this.scoutData) {
      // Handle age_groups
      const rawAgeGroups = this.scoutData.age_groups as unknown;
      if (!Array.isArray(rawAgeGroups)) {
        if (typeof rawAgeGroups === 'string') {
          try {
            const parsedGroups = JSON.parse(rawAgeGroups);
            this.scoutData.age_groups = Array.isArray(parsedGroups) ? parsedGroups : [parsedGroups];
          } catch {
            // If JSON parsing fails, split by comma
            this.scoutData.age_groups = rawAgeGroups.split(',').map((group: string): string => group.trim());
          }
        } else {
          this.scoutData.age_groups = [];
        }
      }

      // Handle certifications
      const rawCertifications = this.scoutData.certifications as unknown;
      if (!Array.isArray(rawCertifications)) {
        if (typeof rawCertifications === 'string') {
          try {
            const parsedCerts = JSON.parse(rawCertifications);
            this.scoutData.certifications = Array.isArray(parsedCerts) ? parsedCerts : [parsedCerts];
          } catch {
            // If JSON parsing fails, split by comma
            this.scoutData.certifications = rawCertifications.split(',').map((cert: string): string => cert.trim());
          }
        } else {
          this.scoutData.certifications = [];
        }
      }
    }
  }

  toggleSettingsMenu() {
    this.showSettingsMenu = !this.showSettingsMenu;
    if (this.showSettingsMenu) {
      document.addEventListener('click', this.handleClickOutside);
    } else {
      document.removeEventListener('click', this.handleClickOutside);
    }
  }

  handleClickOutside = (event: MouseEvent) => {
    const settingsMenu = document.querySelector('.settings-menu');
    if (settingsMenu && !settingsMenu.contains(event.target as Node)) {
      this.showSettingsMenu = false;
      document.removeEventListener('click', this.handleClickOutside);
    }
  };

  ngOnDestroy() {
    document.removeEventListener('click', this.handleClickOutside);
  }

  getArrayFromString(value: string | null | undefined): string[] {
    if (!value) return [];
    try {
      // Try parsing as JSON first
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // If not JSON, split by comma and clean up
      return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
  }

  goToHome() {
    this.router.navigate(['/home-feed']);
  }
}
