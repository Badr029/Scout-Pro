import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../api.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface PlayerProfile {
  username: string;
  first_name: string;
  last_name: string;
  profile_image: string | File;
  DateofBirth: string;
  phone_number: string;
  height: number;
  weight: number;
  preferred_foot: string;
  position: string;
  secondary_position: string[] | string;
  gender: string;
  nationality: string;
  current_city: string;
  current_club: string;
  previous_clubs: string[] | string;
  playing_style: string;
  transfer_status: string;
  bio: string;
  subscription_plan?: string;
  remaining_uploads?: number;
  email?: string;
  [key: string]: any; // Allow string indexing
}

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.css',
  encapsulation: ViewEncapsulation.None
})
export class EditProfileComponent implements OnInit {
  playerData: PlayerProfile | null = null;
  loading = true;
  error = '';
  saveError = '';
  successMessage = '';
  profileImageFile: File | null = null;
  newSecondaryPosition: string = '';
  newClub: string = '';
  Array = Array; // Make Array available to the template

  // Available options for select fields
  positions = [
    {value: 'GK - Goalkeeper', label: 'GK - Goalkeeper'},
    {value: 'CB - Center Back', label: 'CB - Center Back'},
    {value: 'RB - Right Back', label: 'RB - Right Back'},
    {value: 'LB - Left Back', label: 'LB - Left Back'},
    {value: 'RWB - Right Wing Back', label: 'RWB - Right Wing Back'},
    {value: 'LWB - Left Wing Back', label: 'LWB - Left Wing Back'},
    {value: 'SW - Sweeper', label: 'SW - Sweeper'},
    {value: 'CDM - Defensive Midfielder', label: 'CDM - Defensive Midfielder'},
    {value: 'CM - Central Midfielder', label: 'CM - Central Midfielder'},
    {value: 'CAM - Attacking Midfielder', label: 'CAM - Attacking Midfielder'},
    {value: 'RM - Right Midfielder', label: 'RM - Right Midfielder'},
    {value: 'LM - Left Midfielder', label: 'LM - Left Midfielder'},
    {value: 'RW - Right Winger', label: 'RW - Right Winger'},
    {value: 'LW - Left Winger', label: 'LW - Left Winger'},
    {value: 'CF - Center Forward', label: 'CF - Center Forward'},
    {value: 'ST - Striker', label: 'ST - Striker'},
    {value: 'SS - Second Striker', label: 'SS - Second Striker'}
  ];

  preferredFootOptions = [
    {value: 'Left', label: 'Left'},
    {value: 'Right', label: 'Right'},
    {value: 'Both', label: 'Both'}
  ];

  genderOptions = [
    {value: 'male', label: 'Male'},
    {value: 'female', label: 'Female'}
  ];

  transferStatusOptions = [
    {value: 'Available', label: 'Available'},
    {value: 'Not Available', label: 'Not Available'},
    {value: 'Loan', label: 'Loan'}
  ];

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

  constructor(
    private router: Router,
    private apiService: ApiService,
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

    this.loading = true;
    this.error = '';

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any>('http://localhost:8000/api/profile', { headers })
      .subscribe({
        next: (response) => {
          console.log('Profile response:', response);
          if (response && response.data) {
            this.playerData = response.data;

            // Ensure all required fields have at least empty values
            this.initializeDefaultValues();

            // Ensure arrays are properly initialized - this must be called before accessing array properties
            this.initializeArrayFields();

            // Always convert to arrays
            if (this.playerData) {
              // Initialize secondary_position as empty array if it doesn't exist
              if (!this.playerData.secondary_position) {
                this.playerData.secondary_position = [];
              }
              // Convert to array if it's a string
              else if (!Array.isArray(this.playerData.secondary_position)) {
                const secondaryPos = String(this.playerData.secondary_position);
                this.playerData.secondary_position = secondaryPos ? [secondaryPos] : [];
              }

              // Initialize previous_clubs as empty array if it doesn't exist
              if (!this.playerData.previous_clubs) {
                this.playerData.previous_clubs = [];
              }
              // Handle string value for previous_clubs by splitting on commas
              else if (typeof this.playerData.previous_clubs === 'string') {
                const clubsString = String(this.playerData.previous_clubs);
                this.playerData.previous_clubs = clubsString
                  ? clubsString.split(',').map(c => c.trim()).filter(c => c.length > 0)
                  : [];
              }
              // Ensure it's an array in all other cases
              else if (!Array.isArray(this.playerData.previous_clubs)) {
                this.playerData.previous_clubs = [];
              }
            }

            // Format date for the date input
            if (this.playerData && this.playerData.DateofBirth) {
              try {
                // Attempt to format the date as yyyy-MM-dd for the input field
                const date = new Date(this.playerData.DateofBirth);
                if (!isNaN(date.getTime())) {
                  this.playerData.DateofBirth = date.toISOString().split('T')[0];
                }
              } catch (e) {
                console.error('Error formatting date:', e);
              }
            }

            console.log('Initialized player data:', this.playerData);
          } else {
            this.error = 'Invalid profile data received from server';
            console.error('Invalid profile data:', response);
          }
          this.loading = false;
        },
        error: (error) => {
          this.error = error.error?.message || 'Failed to load profile data';
          this.loading = false;
          console.error('Profile fetch error:', error);
        }
      });
  }

  // Initialize default values for any missing fields
  initializeDefaultValues() {
    if (!this.playerData) {
      this.playerData = {} as PlayerProfile;
    }

    const defaultValues = {
      first_name: '',
      last_name: '',
      DateofBirth: '',
      phone_number: '',
      height: 0,
      weight: 0,
      preferred_foot: 'right',
      position: '',
      secondary_position: [],
      gender: 'male',
      nationality: '',
      current_city: '',
      current_club: '',
      previous_clubs: [],
      playing_style: '',
      transfer_status: 'not_available',
      bio: ''
    };

    // Ensure all fields have at least default values
    for (const [key, value] of Object.entries(defaultValues)) {
      if (this.playerData[key] === undefined || this.playerData[key] === null) {
        this.playerData[key] = value;
      }
    }

    // Ensure secondary_position and previous_clubs are arrays
    this.initializeArrayFields();
  }

  onProfileImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.profileImageFile = input.files[0];

      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewImg = document.getElementById('profile-image') as HTMLImageElement;
        if (previewImg && e.target?.result) {
          previewImg.src = e.target.result.toString();
        }
      };
      reader.readAsDataURL(this.profileImageFile);
    }
  }

  saveChanges() {
    if (!this.playerData) {
      this.error = 'No profile data available';
      return;
    }

    this.saveError = '';
    this.successMessage = '';
    console.log('Form submission started with data:', this.playerData);

    // Validate required fields
    const requiredFields = [
      'first_name', 'last_name', 'gender', 'phone_number', 'nationality',
      'height', 'weight', 'current_city', 'position', 'preferred_foot', 'current_club', 'transfer_status', 'DateofBirth'
    ];

    // We already checked this.playerData is not null above, so we can use non-null assertion here
    const playerData = this.playerData!;

    const missingFields = requiredFields.filter(field =>
      playerData[field] === undefined ||
      playerData[field] === null ||
      playerData[field] === '' ||
      (typeof playerData[field] === 'string' && playerData[field].trim() === '')
    );

    if (missingFields.length > 0) {
      this.saveError = `Please fill in all required fields: ${missingFields.join(', ')}`;
      console.error('Missing required fields:', missingFields);
      return;
    }

    try {
      // Create data object to send
      const profileData = {...playerData};

      // Ensure numeric fields are actually numbers
      profileData.height = typeof profileData.height === 'string' ?
                           parseInt(profileData.height) : profileData.height;
      profileData.weight = typeof profileData.weight === 'string' ?
                           parseInt(profileData.weight) : profileData.weight;

      // Format date if needed (ensure yyyy-MM-dd format)
      if (profileData.DateofBirth && typeof profileData.DateofBirth === 'string') {
        // If already a date string, make sure it's in the correct format
        if (!profileData.DateofBirth.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const date = new Date(profileData.DateofBirth);
          profileData.DateofBirth = date.toISOString().split('T')[0];
        }
      }

      // Ensure arrays are properly formatted
      if (typeof profileData.secondary_position === 'string') {
        profileData.secondary_position = [profileData.secondary_position];
      } else if (!Array.isArray(profileData.secondary_position)) {
        profileData.secondary_position = [];
      }

      if (typeof profileData.previous_clubs === 'string') {
        // Use type assertion to let TypeScript know we're checking the type
        profileData.previous_clubs = (profileData.previous_clubs as string).split(',').map(c => c.trim());
      } else if (!Array.isArray(profileData.previous_clubs)) {
        profileData.previous_clubs = [];
      }

      // Add profile image if selected
      if (this.profileImageFile) {
        profileData.profile_image = this.profileImageFile;
      }

      console.log('Sending profile data to API:', profileData);

      this.apiService.tryUpdatePlayerProfile(profileData)
        .subscribe({
          next: (response) => {
            console.log('Profile updated successfully:', response);
            this.successMessage = 'Profile updated successfully!';
            setTimeout(() => {
              this.goToProfile();
            }, 1500);
          },
          error: (error) => {
            console.error('Profile update error:', error);
            if (error.error && error.error.message) {
              this.saveError = error.error.message;
            } else if (error.message) {
              this.saveError = error.message;
            } else {
              this.saveError = 'Failed to update profile. Please check all fields and try again.';
            }

            // Show field-specific errors if they exist
            if (error.error && error.error.errors) {
              const errorKeys = Object.keys(error.error.errors);
              if (errorKeys.length > 0) {
                this.saveError += ' ' + errorKeys.map(key => {
                  return `${key}: ${error.error.errors[key].join(', ')}`;
                }).join('. ');
              }
            }
          }
        });
    } catch (error) {
      console.error('Exception during form submission:', error);
      this.saveError = 'An unexpected error occurred. Please try again.';
    }
  }

  openPhotoUpload() {
    document.getElementById('photo-upload')?.click();
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  // Initialize arrays for previous_clubs and secondary_position
  initializeArrayFields() {
    if (!this.playerData) return;

    // Handle secondary_position
    if (!this.playerData.secondary_position) {
      this.playerData.secondary_position = [];
    }
    else if (typeof this.playerData.secondary_position === 'string') {
      try {
        // First attempt to parse as JSON
        if (this.playerData.secondary_position.startsWith('[')) {
          let parsed = JSON.parse(this.playerData.secondary_position as string);

          // Handle nested JSON
          if (Array.isArray(parsed) && parsed.length === 1 && typeof parsed[0] === 'string' && parsed[0].startsWith('[')) {
            try {
              parsed = JSON.parse(parsed[0]);
            } catch (e) {
              console.error('Failed to parse nested JSON for secondary position', e);
            }
          }

          this.playerData.secondary_position = Array.isArray(parsed) ? parsed : [];
        }
        // If not JSON, split by commas (fallback)
        else {
          this.playerData.secondary_position = [(this.playerData.secondary_position as string)];
        }
      } catch (e) {
        console.error('Error parsing secondary position JSON:', e);
        this.playerData.secondary_position = [(this.playerData.secondary_position as string)];
      }
    }

    // Ensure it's an array
    if (!Array.isArray(this.playerData.secondary_position)) {
      this.playerData.secondary_position = [];
    }

    // Handle previous_clubs
    if (!this.playerData.previous_clubs) {
      this.playerData.previous_clubs = [];
    }
    else if (typeof this.playerData.previous_clubs === 'string') {
      try {
        // First attempt to parse as JSON
        if (this.playerData.previous_clubs.startsWith('[')) {
          let parsed = JSON.parse(this.playerData.previous_clubs as string);

          // Handle nested JSON
          if (Array.isArray(parsed) && parsed.length === 1 && typeof parsed[0] === 'string' && parsed[0].startsWith('[')) {
            try {
              parsed = JSON.parse(parsed[0]);
            } catch (e) {
              console.error('Failed to parse nested JSON for previous clubs', e);
            }
          }

          this.playerData.previous_clubs = Array.isArray(parsed) ? parsed : [];
        }
        // If not JSON, split by commas
        else {
          const clubsStr = this.playerData.previous_clubs as string;
          this.playerData.previous_clubs = clubsStr.split(',').map(c => c.trim()).filter(c => c.length > 0);
        }
      } catch (e) {
        console.error('Error parsing previous clubs JSON:', e);
        const clubsStr = this.playerData.previous_clubs as string;
        this.playerData.previous_clubs = clubsStr.split(',').map(c => c.trim()).filter(c => c.length > 0);
      }
    }

    // Ensure it's an array
    if (!Array.isArray(this.playerData.previous_clubs)) {
      this.playerData.previous_clubs = [];
    }
  }

  // Add secondary position to the array
  addSecondaryPosition() {
    if (!this.playerData) return;

    // Ensure secondary_position is an array
    if (typeof this.playerData.secondary_position === 'string') {
      this.playerData.secondary_position = [this.playerData.secondary_position as string];
    } else if (!Array.isArray(this.playerData.secondary_position)) {
      this.playerData.secondary_position = [];
    }

    if (this.newSecondaryPosition && !(this.playerData.secondary_position as string[]).includes(this.newSecondaryPosition)) {
      (this.playerData.secondary_position as string[]).push(this.newSecondaryPosition);
      this.newSecondaryPosition = '';
    }
  }

  // Remove a secondary position from the array
  removeSecondaryPosition(position: string) {
    if (!this.playerData) return;

    // Ensure secondary_position is an array
    if (typeof this.playerData.secondary_position === 'string') {
      this.playerData.secondary_position = [this.playerData.secondary_position as string];
    } else if (!Array.isArray(this.playerData.secondary_position)) {
      this.playerData.secondary_position = [];
    }

    this.playerData.secondary_position = (this.playerData.secondary_position as string[]).filter((pos: string) => pos !== position);
  }

  // Add previous club to the array
  addPreviousClub() {
    if (!this.playerData) return;

    // Ensure previous_clubs is an array
    if (typeof this.playerData.previous_clubs === 'string') {
      this.playerData.previous_clubs = (this.playerData.previous_clubs as string).split(',').map(c => c.trim());
    } else if (!Array.isArray(this.playerData.previous_clubs)) {
      this.playerData.previous_clubs = [];
    }

    const club = this.newClub.trim();
    if (club && !(this.playerData.previous_clubs as string[]).includes(club)) {
      (this.playerData.previous_clubs as string[]).push(club);
      this.newClub = '';
    }
  }

  // Remove a previous club from the array
  removePreviousClub(club: string) {
    if (!this.playerData) return;

    // Ensure previous_clubs is an array
    if (typeof this.playerData.previous_clubs === 'string') {
      this.playerData.previous_clubs = (this.playerData.previous_clubs as string).split(',').map(c => c.trim());
    } else if (!Array.isArray(this.playerData.previous_clubs)) {
      this.playerData.previous_clubs = [];
    }

    this.playerData.previous_clubs = (this.playerData.previous_clubs as string[]).filter((c: string) => c !== club);
  }

  // Get available secondary positions (exclude primary position and already selected ones)
  get availableSecondaryPositions(): string[] {
    if (!this.playerData) return [];

    // Make sure we have a valid array to work with
    const currentPosition = this.playerData.position || '';
    let secondaryPositions: string[] = [];

    if (Array.isArray(this.playerData.secondary_position)) {
      secondaryPositions = this.playerData.secondary_position;
    } else if (typeof this.playerData.secondary_position === 'string' && this.playerData.secondary_position) {
      secondaryPositions = [this.playerData.secondary_position];
    }

    return this.positions
      .map(pos => pos.value)
      .filter(pos => pos !== currentPosition && !secondaryPositions.includes(pos));
  }

  // Getter to provide appropriate transfer status options based on club selection
  get availableTransferStatusOptions() {
    if (!this.playerData) return this.transferStatusOptions;

    // If player is a free agent, only "Available" should be available
    if (this.playerData.current_club === 'Free Agent') {
      return [
        {value: 'Available', label: 'Available'}
      ];
    }

    // Otherwise, all options are available
    return this.transferStatusOptions;
  }
}
