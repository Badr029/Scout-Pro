import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth.service';

interface PlayerFormData {
  profile_image: File | null;
  DateofBirth: string;
  phone_number: string;
  height: number | null;
  weight: null;
  preferred_foot: string;
  position: string;
  secondary_position: string[];
  gender: string;
  nationality: string;
  current_city: string;
  current_club: string;
  previous_clubs: string[];
  playing_style: string;
  transfer_status: string;
  bio: string;
  [key: string]: any;
}

@Component({
  selector: 'app-register-player',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register-player.component.html',
  styleUrls: [
    './register-player.component.css',
    '../shared/styles/auth-background.css'
  ]
})
export class RegisterPlayerComponent {
  previewUrl: string | null = null;
  newClub: string = '';
  newSecondaryPosition: string = '';

  egyptianClubs = [
    'Free Agent',
    'Al Ahly SC',
    'Zamalek SC',
    'Pyramids FC',
    'Future FC',
    'Al Masry SC',
    'Ceramica Cleopatra FC',
    'National Bank SC',
    'Al Mokawloon Al Arab',
    'ENPPI SC',
    'Ismaily SC',
    'El Gouna FC',
    'Ghazl El Mahalla',
    'Al Ittihad Alexandria',
    'Pharco FC',
    'Tala\'ea El Gaish',
    'ZED FC',
    'El Dakhleya',
    'Modern Future FC'
  ];

  transferStatusOptions = [
    'Available',
    'Not Available',
    'Loan'
  ];

  footballPositions = [
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

  formData: PlayerFormData = {
    profile_image: null,
    DateofBirth: '',
    phone_number: '',
    height: null,
    weight: null,
    preferred_foot: '',
    position: '',
    secondary_position: [],
    gender: '',
    nationality: '',
    current_city: '',
    current_club: '',
    previous_clubs: [],
    playing_style: '',
    transfer_status: '',
    bio: ''
  };

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

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.formData.profile_image = file;

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeFile(event: Event, field: string) {
    event.preventDefault();
    if (field === 'profile_image') {
      this.formData.profile_image = null;
      this.previewUrl = null;
    }
  }

  addPreviousClub() {
    const club = this.newClub.trim();
    if (club && !this.formData.previous_clubs.includes(club)) {
      this.formData.previous_clubs.push(club);
      this.newClub = ''; // Clear input
    }
  }

  removePreviousClub(club: string) {
    this.formData.previous_clubs = this.formData.previous_clubs.filter(c => c !== club);
  }

  addSecondaryPosition() {
    if (this.newSecondaryPosition && !this.formData.secondary_position.includes(this.newSecondaryPosition)) {
      this.formData.secondary_position.push(this.newSecondaryPosition);
      this.newSecondaryPosition = '';
    }
  }

  removeSecondaryPosition(position: string) {
    this.formData.secondary_position = this.formData.secondary_position.filter(pos => pos !== position);
  }

  onSubmit() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = new FormData();

    // Append all form fields to FormData
    Object.keys(this.formData).forEach(key => {
      if (key === 'profile_image' && this.formData[key]) {
        formData.append(key, this.formData[key] as File);
      } else if (key === 'previous_clubs' || key === 'secondary_position') {
        formData.append(key, JSON.stringify(this.formData[key]));
      } else {
        formData.append(key, this.formData[key]?.toString() || '');
      }
    });

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    this.http.post('http://localhost:8000/api/player/setup', formData, { headers })
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          this.successMessage = 'Profile setup completed successfully! Redirecting to home feed...';

          // Store any necessary user data from the response
          if (response.player) {
            localStorage.setItem('player_data', JSON.stringify(response.player));
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

  onCurrentClubChange() {
    if (this.formData.current_club === 'Free Agent') {
      this.formData.transfer_status = 'Available';
    } else {
      // Reset transfer status if it was previously set to Available due to Free Agent
      if (this.formData.transfer_status === 'Available') {
        this.formData.transfer_status = '';
      }
    }
  }

  get availableTransferStatuses(): string[] {
    return this.formData.current_club === 'Free Agent'
      ? ['Available']
      : this.transferStatusOptions;
  }

  get availableSecondaryPositions(): string[] {
    return this.footballPositions.filter(pos =>
      pos !== this.formData.position &&
      !this.formData.secondary_position.includes(pos)
    );
  }
}
