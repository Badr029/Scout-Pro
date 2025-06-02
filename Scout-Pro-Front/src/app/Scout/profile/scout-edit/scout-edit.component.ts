import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface ScoutProfile {
  first_name: string;
  last_name: string;
  profile_image?: string;
  city: string;
  country: string;
  contact_email: string;
  contact_phone: string;
  organization: string;
  position_title: string;
  scouting_regions: string[];
  age_groups: string[];
  preferred_roles: string[];
  clubs_worked_with: string;
  linkedin_url?: string;
}

@Component({
  selector: 'app-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scout-edit.component.html',
  styleUrls: ['./scout-edit.component.scss']
})
export class ScoutEditComponent implements OnInit {
  loading: boolean = false;
  error: string | null = null;
  scoutData: Partial<ScoutProfile> = {
    scouting_regions: [],
    age_groups: [],
    preferred_roles: []
  };
  private apiUrl = 'http://localhost:8000/api';
  newProfileImage: File | null = null;

  // New properties for multi-select
  newRegion: string = '';
  newAgeGroup: string = '';
  newRole: string = '';

  // Predefined lists for dropdowns
  ageGroupsList = [
    'U12',
    'U14',
    'U16',
    'U17',
    'U18',
    'U19',
    'U21',
    'U23',
    'Senior'
  ];

  playerRolesList = [
    'Goalkeepers',
    'Center Backs',
    'Full Backs',
    'Defensive Midfielders',
    'Central Midfielders',
    'Attacking Midfielders',
    'Wingers',
    'Strikers'
  ];

  regionsList = [
    'Egypt - Premier League',
    'Egypt - Second Division',
    'Egypt - Third Division',
    'Egypt - Youth Leagues',
    'North Africa',
    'East Africa',
    'West Africa',
    'Middle East',
    'Europe'
  ];

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.fetchScoutProfile();
  }

  fetchScoutProfile() {
    this.loading = true;
    this.error = null;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    this.http.get(`${this.apiUrl}/profile`, { headers })
      .subscribe({
        next: (response: any) => {
          if (response.data) {
            // Convert array fields from string to array if they're strings
            const scoutingRegions = this.parseArrayField(response.data.scouting_regions);
            const ageGroups = this.parseArrayField(response.data.age_groups);
            const preferredRoles = this.parseArrayField(response.data.preferred_roles);

            this.scoutData = {
              ...response.data,
              scouting_regions: scoutingRegions,
              age_groups: ageGroups,
              preferred_roles: preferredRoles
            };
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching profile:', error);
          this.error = error.message || 'Failed to load profile';
          this.loading = false;
        }
      });
  }

  private parseArrayField(field: any): string[] {
    if (Array.isArray(field)) {
      return field;
    }
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        return Array.isArray(parsed) ? parsed : [field];
      } catch {
        return field.split(',').map(item => item.trim()).filter(item => item);
      }
    }
    return [];
  }

  // Multi-select methods
  addItem(item: string, list: 'scouting_regions' | 'age_groups' | 'preferred_roles') {
    const trimmedItem = item.trim();
    if (trimmedItem && !this.scoutData[list]?.includes(trimmedItem)) {
      if (!this.scoutData[list]) {
        this.scoutData[list] = [];
      }
      this.scoutData[list]?.push(trimmedItem);

      // Reset the corresponding input
      switch(list) {
        case 'scouting_regions':
          this.newRegion = '';
          break;
        case 'age_groups':
          this.newAgeGroup = '';
          break;
        case 'preferred_roles':
          this.newRole = '';
          break;
      }
    }
  }

  removeItem(item: string, list: 'scouting_regions' | 'age_groups' | 'preferred_roles') {
    if (this.scoutData[list]) {
      this.scoutData[list] = this.scoutData[list]?.filter(i => i !== item) || [];
    }
  }

  openPhotoUpload() {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onProfileImageChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.newProfileImage = file;
    }
  }

  async saveChanges() {
    this.loading = true;
    this.error = null;

    try {
      // First, handle profile image update if there's a new image
      if (this.newProfileImage) {
        await this.updateProfileImage();
      }

      // Then update other profile data
      await this.updateProfileData();

      this.loading = false;
      this.router.navigate(['/scout/profile']);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      this.loading = false;
      if (error.error?.errors) {
        this.error = Object.values(error.error.errors).flat().join('\n');
      } else {
        this.error = error.message || 'Failed to update profile';
      }
    }
  }

  private async updateProfileImage(): Promise<void> {
    if (!this.newProfileImage) return;

    const formData = new FormData();
    formData.append('profile_image', this.newProfileImage);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    return new Promise((resolve, reject) => {
      this.http.post(`${this.apiUrl}/scout/profile/update-photo`, formData, { headers })
        .subscribe({
          next: (response: any) => {
            this.scoutData.profile_image = response.data.profile_image;
            resolve();
          },
          error: (error) => reject(error)
        });
    });
  }

  private async updateProfileData(): Promise<void> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      'Content-Type': 'application/json'
    });

    // Prepare the data for submission, excluding profile_image
    const { profile_image, ...updateData } = this.scoutData;

    // Convert arrays to JSON strings
    const dataToSend = {
      ...updateData,
      scouting_regions: JSON.stringify(updateData.scouting_regions || []),
      age_groups: JSON.stringify(updateData.age_groups || []),
      preferred_roles: JSON.stringify(updateData.preferred_roles || [])
    };

    console.log('Sending profile update data:', dataToSend);

    return new Promise((resolve, reject) => {
      this.http.put(`${this.apiUrl}/scout/profile/update`, dataToSend, { headers })
        .subscribe({
          next: () => resolve(),
          error: (error) => {
            console.error('Profile update error:', error);
            console.error('Error response:', error.error);
            console.error('Status:', error.status);
            console.error('Status text:', error.statusText);
            reject(error);
          }
        });
    });
  }

  onIDProofUpload(event: Event) {
    // Handle ID proof upload
  }

  onCertificationsUpload(event: Event) {
    // Handle certifications upload
  }

  goToProfile() {
    this.router.navigate(['/scout/profile']);
  }
}
