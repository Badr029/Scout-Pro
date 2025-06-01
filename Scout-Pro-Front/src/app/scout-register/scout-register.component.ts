import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth.service';

interface ScoutFormData {
  profile_image: File | null;
  city: string;
  country: string;
  contact_email: string;
  contact_phone: string;

  // Organization and Role Information
  organization: string;
  position_title: string;
  scouting_regions: string[];
  age_groups: string[];
  preferred_roles: string[];
  clubs_worked_with: string;

  // Professional Information
  linkedin_url: string;
  id_proof: File | null;
  certifications: File[];

  [key: string]: any; // Index signature
}

@Component({
  selector: 'app-scout-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scout-register.component.html',
  styleUrls: [
    './scout-register.component.css',
    '../shared/styles/auth-background.css'
  ]
})
export class ScoutRegisterComponent {
  previewUrl: string | null = null;
  newRegion: string = '';
  newAgeGroup: string = '';
  newRole: string = '';

  formData: ScoutFormData = {
    profile_image: null,
    city: '',
    country: '',
    contact_email: '',
    contact_phone: '',
    organization: '',
    position_title: '',
    scouting_regions: [],
    age_groups: [],
    preferred_roles: [],
    clubs_worked_with: '',
    linkedin_url: '',
    id_proof: null,
    certifications: []
  };

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

  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  triggerFileInput(inputId: string) {
    document.getElementById(inputId)?.click();
  }

  onFileSelected(event: any, field: 'profile_image' | 'id_proof' | 'certifications') {
    const files = event.target.files;
    if (!files) return;

    if (field === 'profile_image') {
      const file = files[0];
      if (file) {
        this.formData.profile_image = file;
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewUrl = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    } else if (field === 'certifications') {
      this.formData.certifications = Array.from(files);
    } else {
      this.formData[field] = files[0];
    }
  }

  addItem(item: string, list: keyof ScoutFormData) {
    const trimmedItem = item.trim();
    if (trimmedItem && !this.formData[list].includes(trimmedItem)) {
      (this.formData[list] as string[]).push(trimmedItem);
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

  removeItem(item: string, list: keyof ScoutFormData) {
    this.formData[list] = (this.formData[list] as string[]).filter(i => i !== item);
  }

  removeCertification(index: number) {
    this.formData.certifications = this.formData.certifications.filter((_, i) => i !== index);
  }

  removeFile(event: Event, field: 'id_proof' | 'profile_image') {
    if (event) {
      event.stopPropagation();
    }
    this.formData[field] = null;
    if (field === 'profile_image') {
      this.previewUrl = null;
    }
  }

  onSubmit() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = new FormData();

    // Append all form fields to FormData
    Object.keys(this.formData).forEach(key => {
      const value = this.formData[key];
      if (key === 'profile_image' && value) {
        formData.append(key, value as File);
      } else if (key === 'id_proof' && value) {
        formData.append(key, value as File);
      } else if (key === 'certifications' && value.length) {
        // Append each certification file
        value.forEach((file: File) => {
          formData.append('certifications[]', file);
        });
      } else if (Array.isArray(value)) {
        // Handle arrays (scouting_regions, age_groups, preferred_roles)
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value?.toString() || '');
      }
    });

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    this.http.post('http://localhost:8000/api/scout/setup', formData, { headers })
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          this.successMessage = 'Profile setup completed successfully! Redirecting to home feed...';

          // Store any necessary user data from the response
          if (response.scout) {
            localStorage.setItem('scout_data', JSON.stringify(response.scout));
          }

          // Set setup completion flag
          localStorage.setItem('setup_completed', 'true');

          // Redirect to home feed after a short delay to show success message
          setTimeout(() => {
            this.router.navigate(['/home-feed'])
              .then(() => {
                // Force reload the page after navigation
                window.location.reload();
              })
              .catch(err => {
                console.error('Navigation failed:', err);
                this.errorMessage = 'Failed to redirect. Please go to home feed manually.';
              });
          }, 1500);
        },
        error: (error) => {
          this.loading = false;
          if (error.error?.errors) {
            // Handle validation errors
            const errors = Object.values(error.error.errors).flat();
            this.errorMessage = errors.join('\n');
          } else if (error.error?.message) {
            this.errorMessage = error.error.message;
          } else {
            this.errorMessage = 'Failed to setup profile. Please try again.';
          }
        }
      });
  }
}
