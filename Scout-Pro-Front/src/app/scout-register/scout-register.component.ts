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
    '../shared/styles/auth-background.scss'
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
    // Goalkeeper
    'GK - Goalkeeper',

    // Defenders
    'CB - Center Back',
    'RB - Right Back',
    'LB - Left Back',
    'RWB - Right Wing Back',
    'LWB - Left Wing Back',
    'SW - Sweeper',

    // Midfielders
    'CDM - Defensive Midfielder',
    'CM - Central Midfielder',
    'CAM - Attacking Midfielder',
    'RM - Right Midfielder',
    'LM - Left Midfielder',

    // Forwards
    'RW - Right Winger',
    'LW - Left Winger',
    'CF - Center Forward',
    'ST - Striker',
    'SS - Second Striker'
  ];

  regionsList = [
    'Egypt - Premier League',
    'Egypt - Second Division',
    'Egypt - Third Division',
    'Egypt - Youth Leagues',
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
    console.log(`File selected for ${field}:`, files);
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
    } else if (field === 'id_proof') {
      console.log('Setting id_proof file:', files[0]);
      this.formData.id_proof = files[0];
    }
    console.log('Updated formData:', this.formData);
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

  async logout() {
    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect to login even if logout API fails
      this.router.navigate(['/login']);
    }
  }

  onSubmit() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = new FormData();

    // Append profile image if exists
    if (this.formData.profile_image) {
      formData.append('profile_image', this.formData.profile_image);
    }

    // Append ID proof if exists
    if (this.formData.id_proof) {
      formData.append('id_proof', this.formData.id_proof);
    }

    // Append certifications if any
    if (this.formData.certifications.length > 0) {
      this.formData.certifications.forEach((file: File) => {
        formData.append('certifications[]', file);
      });
    }

    // Append all other fields
    formData.append('city', this.formData.city);
    formData.append('country', this.formData.country);
    formData.append('contact_email', this.formData.contact_email);
    formData.append('contact_phone', this.formData.contact_phone);
    formData.append('organization', this.formData.organization);
    formData.append('position_title', this.formData.position_title);
    formData.append('scouting_regions', JSON.stringify(this.formData.scouting_regions || []));
    formData.append('age_groups', JSON.stringify(this.formData.age_groups || []));
    formData.append('preferred_roles', JSON.stringify(this.formData.preferred_roles || []));
    formData.append('clubs_worked_with', this.formData.clubs_worked_with);
    formData.append('linkedin_url', this.formData.linkedin_url || '');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    this.http.post('http://localhost:8000/api/scout/setup', formData, { headers })
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          this.successMessage = 'Profile setup completed successfully! Redirecting to subscription page...';

          if (response.scout) {
            localStorage.setItem('scout_data', JSON.stringify(response.scout));
          }

          localStorage.setItem('setup_completed', 'true');

          setTimeout(() => {
            this.router.navigate(['/scout-subscription'])
              .catch(err => {
                console.error('Navigation failed:', err);
                this.errorMessage = 'Failed to redirect. Please try again.';
              });
          }, 1500);
        },
        error: (error: any) => this.handleError(error)
      });
  }

  private handleError(error: any) {
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
    console.error('Setup error:', error);
  }
}
