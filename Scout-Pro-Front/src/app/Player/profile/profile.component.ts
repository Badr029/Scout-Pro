import { Component, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  secondary_position: any; // Can be array, string, or JSON
  gender: string;
  nationality: string;
  current_city: string;
  current_club: string;
  previous_clubs: any; // Can be array, string, or JSON
  playing_style: string;
  transfer_status: string;
  bio: string;
  subscription_plan: string;
  remaining_uploads?: number;
  registration_type?: string; // 'email' or 'google'
}

interface Video {
  id: number;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  created_at: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ProfileComponent implements OnInit, OnDestroy {
  playerData: PlayerProfile | null = null;
  loading = true;
  error = '';
  activeTab = 'about';
  videos: Video[] = [];
  showDeleteConfirm = false;
  deletePassword = '';
  deleteConfirmation = '';
  deleteError = '';
  isGoogleAccount = false;
  showSettingsMenu = false;
  showUploadModal = false;
  showBioModal = false;
  bioText = '';
  bioError = '';
  uploadData = {
    title: '',
    description: '',
    file: null as File | null
  };
  uploadProgress = 0;
  uploadError = '';
  Array = Array; // Make Array available to the template

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    console.log('Profile component initialized');
    this.fetchPlayerProfile();
    this.fetchPlayerVideos();

    // Handle videos array early to avoid NgFor issues if it's not an array
    if (this.videos && !Array.isArray(this.videos)) {
      console.error('Videos is not an array:', this.videos);
      this.videos = [];
    }

    // Add event listener to detect when DOM is fully loaded
    window.addEventListener('DOMContentLoaded', () => {
      console.log('DOM fully loaded - UI will update automatically through Angular bindings');
    });

    // Also add a backup timeout as a safety net
    setTimeout(() => {
      console.log('Safety timeout - ensuring UI is updated');
    }, 1000);
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
          console.log('Profile response:', response);

          this.playerData = response.data;

          if (this.playerData) {
            // Check if this is a Google account
            if (response.data.registration_type === 'google') {
              this.isGoogleAccount = true;
              console.log('This is a Google account');
            } else {
              this.isGoogleAccount = false;
            }

            // Fix profile image path if needed
            if (!this.playerData.profile_image || (
                this.playerData.profile_image &&
                !this.playerData.profile_image.startsWith('http') &&
                !this.playerData.profile_image.includes('storage/'))) {
              if (response.data.user?.profile_image) {
                this.playerData.profile_image = response.data.user.profile_image;
              }
            }

            // Process and normalize JSON fields that might come in different formats
            this.normalizeProfileData();

            // UI displays are now updated automatically through Angular bindings
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

  fetchPlayerVideos() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.videos = [];
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any>('http://localhost:8000/api/videos', { headers })
      .subscribe({
        next: (response) => {
          // Ensure we always have an array for videos
          console.log('Videos response:', response);

          if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
            // Filter out any invalid video objects
            this.videos = response.data.filter((video: any) => {
              return video && typeof video === 'object' && video.title;
            });

            if (this.videos.length === 0) {
              console.warn('No valid video objects found in response');
            }
          } else if (response && response.data && !Array.isArray(response.data) && typeof response.data === 'object') {
            console.warn('Videos data is not an array, checking if it\'s a valid video object:', response.data);
            // If it's a valid video object, put it in an array
            if (response.data.title) {
              this.videos = [response.data];
            } else {
              this.videos = [];
            }
          } else {
            console.log('No videos found or invalid data format');
            this.videos = [];
          }
        },
        error: (error) => {
          console.error('Failed to load videos', error);
          this.videos = []; // Initialize as empty array on error
        }
      });
  }

  goToEditProfile() {
    this.router.navigate(['/edit-profile']);
  }

  logout() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      localStorage.removeItem('auth_token');
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.post<any>('http://localhost:8000/api/logout', {}, { headers })
      .subscribe({
        next: () => {
          localStorage.removeItem('auth_token');
          this.router.navigate(['/login']);
        },
        error: () => {
          localStorage.removeItem('auth_token');
          this.router.navigate(['/login']);
        }
      });
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
    // Different validation based on account type
    if (this.isGoogleAccount) {
      // For Google accounts, check if user typed "delete" to confirm
      if (this.deleteConfirmation.toLowerCase() !== 'delete') {
        this.deleteError = 'Please type "delete" to confirm';
        return;
      }
    } else {
      // For email accounts, require password
      if (!this.deletePassword) {
        this.deleteError = 'Password is required';
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

    // Create request data based on account type
    const requestData = this.isGoogleAccount
      ? { confirm_delete: this.deleteConfirmation }
      : { password: this.deletePassword };

    // Try the AccountController's delete method first
    this.http.post<any>('http://localhost:8000/api/account/delete', requestData, { headers })
      .subscribe({
        next: () => {
          localStorage.removeItem('auth_token');
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Error with account/delete:', error);
          // If there's a database error, try the ProfileController's delete method as backup
          if (error.status === 500 && error.error && error.error.message &&
              error.error.message.includes("Table 'scoutpro.videos' doesn't exist")) {

            console.log('Trying backup delete method');
            this.tryBackupDelete(headers, requestData);
          } else {
            this.deleteError = error.error.message || 'Failed to delete account';
          }
        }
      });
  }

  // Try the backup delete method from ProfileController if AccountController fails
  tryBackupDelete(headers: HttpHeaders, requestData: any) {
    this.http.post<any>('http://localhost:8000/api/profile/delete', requestData, { headers })
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
    console.log(`Switched to ${tab} tab`);

    if (tab === 'career' && this.playerData) {
      console.log('Career tab data:');
      console.log('- current_club:', this.playerData.current_club);
      console.log('- previous_clubs:', this.playerData.previous_clubs);
      console.log('- previous_clubs type:', typeof this.playerData.previous_clubs);
      console.log('- Is Array:', Array.isArray(this.playerData.previous_clubs));
    }
  }

  // Previous clubs are now displayed directly in the template with *ngFor
  // This method is kept for reference but no longer used

  openUploadModal() {
    if (this.playerData?.subscription_plan === 'Free' && (this.playerData?.remaining_uploads ?? 0) <= 0) {
      // Show premium upgrade prompt
      this.router.navigate(['/subscription']);
      return;
    }

    this.showUploadModal = true;
    this.uploadData = {
      title: '',
      description: '',
      file: null
    };
    this.uploadProgress = 0;
    this.uploadError = '';
  }

  closeUploadModal() {
    this.showUploadModal = false;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.uploadData.file = input.files[0];
    }
  }

  uploadVideo() {
    if (!this.uploadData.title || !this.uploadData.description || !this.uploadData.file) {
      this.uploadError = 'Please fill all fields and select a video file';
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const formData = new FormData();
    formData.append('title', this.uploadData.title);
    formData.append('description', this.uploadData.description);
    formData.append('video', this.uploadData.file);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.post<any>('http://localhost:8000/api/videos', formData, {
      headers,
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event: any) => {
        if (event.type === 1) { // HttpEventType.UploadProgress
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === 4) { // HttpEventType.Response
          this.fetchPlayerVideos();
          this.closeUploadModal();
        }
      },
      error: (error) => {
        this.uploadError = error.error.message || 'Failed to upload video';
      }
    });
  }

  goToSubscription() {
    this.router.navigate(['/subscription']);
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

  // Parse a potentially double-encoded JSON string
  parseNestedJson(value: any): any {
    if (typeof value !== 'string') {
      return value;
    }

    try {
      // Check if the string starts with '[' and ends with ']' - signs it might be JSON
      if (value.startsWith('[') && value.endsWith(']')) {
        const parsed = JSON.parse(value);

        // Handle the case where it's an array with a single string that is actually JSON
        if (Array.isArray(parsed) && parsed.length === 1 && typeof parsed[0] === 'string') {
          try {
            // If the single item is JSON, parse it too
            if (parsed[0].startsWith('[') && parsed[0].endsWith(']')) {
              return JSON.parse(parsed[0]);
            }
          } catch (e) {
            // If it fails to parse, return the original parsed array
            console.log('Could not parse inner JSON, using outer parsing');
          }
        }
        return parsed;
      }
      return value;
    } catch (e) {
      console.error('Error parsing JSON:', e);
      return value;
    }
  }

  // Ensure any value is converted to an array for consistent display
  ensureArray(value: any): any[] {
    console.log('ensureArray input:', value);

    // Handle null, undefined, empty string
    if (!value || (typeof value === 'string' && !value.trim())) {
      return [];
    }

    // If it's already an array, return it
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'string') {
      // Try to parse as JSON if it looks like JSON
      if (value.startsWith('[') && value.endsWith(']')) {
        try {
          const parsed = JSON.parse(value);
          console.log('Parsed JSON:', parsed);

          // Handle nested JSON strings (double encoded arrays)
          if (Array.isArray(parsed) && parsed.length === 1 && typeof parsed[0] === 'string') {
            const firstItem = parsed[0];
            if (firstItem.startsWith('[') && firstItem.endsWith(']')) {
              try {
                const nestedParsed = JSON.parse(firstItem);
                console.log('Nested JSON parsed:', nestedParsed);
                return Array.isArray(nestedParsed) ? nestedParsed : [nestedParsed];
              } catch (e) {
                console.error('Failed to parse nested JSON:', e);
              }
            }
          }

          // If we got an array back, return it
          if (Array.isArray(parsed)) {
            return parsed;
          }

          // If we got something else like an object, wrap it in an array
          return [parsed];
        } catch (e) {
          // If parsing failed, it's not valid JSON
          console.error('Failed to parse JSON string:', e);
        }
      }

      // Handle comma-separated values or single value
      return value.includes(',') ?
        value.split(',').map(item => item.trim()).filter(item => item.length > 0) :
        [value];
    }

    // For any other type (object, number, etc.), wrap in array
    return [value];
  }

  // Secondary positions are now displayed directly in the template with *ngFor
  // This method is kept for reference but no longer used

  // Process raw profile data to handle JSON fields that might be strings
  normalizeProfileData() {
    if (!this.playerData) return;

    console.log('Normalizing profile data:');
    console.log('- Previous clubs (raw):', this.playerData.previous_clubs);
    console.log('- Secondary positions (raw):', this.playerData.secondary_position);

    // Process previous_clubs
    try {
      // Handle if it's a string that could be JSON
      if (typeof this.playerData.previous_clubs === 'string') {
        if (this.playerData.previous_clubs.trim() === '') {
          this.playerData.previous_clubs = [];
        } else if (this.playerData.previous_clubs.includes('[')) {
          try {
            const parsed = JSON.parse(this.playerData.previous_clubs as string);

            // Handle double-encoded JSON
            if (Array.isArray(parsed) && parsed.length === 1 && typeof parsed[0] === 'string' && parsed[0].includes('[')) {
              try {
                const innerParsed = JSON.parse(parsed[0]);
                if (Array.isArray(innerParsed)) {
                  this.playerData.previous_clubs = innerParsed;
                } else {
                  this.playerData.previous_clubs = [String(innerParsed)];
                }
              } catch (innerError) {
                console.error('Failed to parse inner previous_clubs JSON:', innerError);
                this.playerData.previous_clubs = parsed;
              }
            } else {
              this.playerData.previous_clubs = Array.isArray(parsed) ? parsed : [String(parsed)];
            }
          } catch (e) {
            console.error('Failed to parse previous_clubs JSON:', e);
            // If JSON parsing fails, treat as a single club name
            this.playerData.previous_clubs = [this.playerData.previous_clubs];
          }
        } else {
          // Single club name as string
          this.playerData.previous_clubs = [this.playerData.previous_clubs];
        }
      } else if (this.playerData.previous_clubs === null) {
        this.playerData.previous_clubs = [];
      } else if (!Array.isArray(this.playerData.previous_clubs)) {
        // Anything else that's not an array (like an object), convert to string and wrap in array
        this.playerData.previous_clubs = [String(this.playerData.previous_clubs)];
      }
    } catch (e) {
      console.error('Error processing previous_clubs:', e);
      this.playerData.previous_clubs = [];
    }

    // Process secondary_position similarly
    try {
      if (typeof this.playerData.secondary_position === 'string') {
        if (this.playerData.secondary_position.trim() === '') {
          this.playerData.secondary_position = [];
        } else if (this.playerData.secondary_position.includes('[')) {
          try {
            const parsed = JSON.parse(this.playerData.secondary_position as string);

            // Handle double-encoded JSON
            if (Array.isArray(parsed) && parsed.length === 1 && typeof parsed[0] === 'string' && parsed[0].includes('[')) {
              try {
                const innerParsed = JSON.parse(parsed[0]);
                if (Array.isArray(innerParsed)) {
                  this.playerData.secondary_position = innerParsed;
                } else {
                  this.playerData.secondary_position = [String(innerParsed)];
                }
              } catch (innerError) {
                console.error('Failed to parse inner secondary_position JSON:', innerError);
                this.playerData.secondary_position = parsed;
              }
            } else {
              this.playerData.secondary_position = Array.isArray(parsed) ? parsed : [String(parsed)];
            }
          } catch (e) {
            console.error('Failed to parse secondary_position JSON:', e);
            this.playerData.secondary_position = [this.playerData.secondary_position];
          }
        } else {
          // Single position as string
          this.playerData.secondary_position = [this.playerData.secondary_position];
        }
      } else if (this.playerData.secondary_position === null) {
        this.playerData.secondary_position = [];
      } else if (!Array.isArray(this.playerData.secondary_position)) {
        this.playerData.secondary_position = [String(this.playerData.secondary_position)];
      }
    } catch (e) {
      console.error('Error processing secondary_position:', e);
      this.playerData.secondary_position = [];
    }

    console.log('Normalized data:');
    console.log('- Previous clubs:', this.playerData.previous_clubs);
    console.log('- Secondary positions:', this.playerData.secondary_position);
  }

  // Toggle settings dropdown menu
  toggleSettingsMenu() {
    this.showSettingsMenu = !this.showSettingsMenu;

    // Add click outside listener if menu is open
    if (this.showSettingsMenu) {
      setTimeout(() => {
        document.addEventListener('click', this.handleClickOutside);
      }, 0);
    } else {
      document.removeEventListener('click', this.handleClickOutside);
    }
  }

  // Handle clicks outside the settings menu to close it
  handleClickOutside = (event: MouseEvent) => {
    const settingsMenu = document.querySelector('.settings-menu');
    if (settingsMenu && !settingsMenu.contains(event.target as Node)) {
      this.showSettingsMenu = false;
      document.removeEventListener('click', this.handleClickOutside);
    }
  }

  // Cleanup event listeners when component is destroyed
  ngOnDestroy() {
    document.removeEventListener('click', this.handleClickOutside);
  }

  // Show the Add/Edit Bio modal
  showAddBioModal() {
    this.bioError = '';
    // If there's existing bio, pre-populate the textarea
    this.bioText = this.playerData?.bio || '';
    this.showBioModal = true;
  }

  // Close the bio modal
  closeBioModal() {
    this.showBioModal = false;
  }

    // Save the bio to the profile
  saveBio() {
    if (this.bioText.trim().length === 0) {
      this.bioError = 'Bio cannot be empty. Please add some text or cancel.';
      return;
    }

    if (!this.playerData) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Create full payload with all required player data fields plus the updated bio
    const payload = {
      bio: this.bioText.trim(),
      first_name: this.playerData.first_name,
      last_name: this.playerData.last_name,
      DateofBirth: this.playerData.DateofBirth,
      phone_number: this.playerData.phone_number,
      height: this.playerData.height,
      weight: this.playerData.weight,
      preferred_foot: this.playerData.preferred_foot,
      position: this.playerData.position,
      gender: this.playerData.gender,
      nationality: this.playerData.nationality,
      current_city: this.playerData.current_city,
      current_club: this.playerData.current_club,
      // Convert arrays to JSON strings for backend processing
      secondary_position: Array.isArray(this.playerData.secondary_position) ?
        JSON.stringify(this.playerData.secondary_position) :
        this.playerData.secondary_position,
      previous_clubs: Array.isArray(this.playerData.previous_clubs) ?
        JSON.stringify(this.playerData.previous_clubs) :
        this.playerData.previous_clubs,
      playing_style: this.playerData.playing_style || '',
      transfer_status: this.playerData.transfer_status || ''
    };

    // Use the correct profile update endpoint
    this.http.put<any>('http://localhost:8000/api/player/profile/update', payload, { headers })
      .subscribe({
        next: (response) => {
          console.log('Bio updated successfully', response);

          // Update the local player data with new bio
          if (this.playerData) {
            this.playerData.bio = this.bioText.trim();
          }

          // Close the modal
          this.closeBioModal();
        },
        error: (error) => {
          console.error('Error updating bio:', error);
          this.bioError = error.error?.message || 'Failed to update bio. Please try again.';
        }
      });
  }
}

