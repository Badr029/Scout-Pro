import { Component, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpEventType } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';

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
  membership: string;
  monthly_video_count: number;
  last_count_reset?: string;
  registration_type?: string; // 'email' or 'google'
}

interface Video {
  id: number;
  title: string;
  description: string;
  url: string;
  thumbnail_url: string;
  file_path: string;
  thumbnail: string;
  views: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  duration?: number;
  thumbnailError?: boolean;
  has_liked?: boolean;
  likes?: any[];
  comments: {
    id: number;
    content: string;
    created_at: string;
    user?: {
      id: number;
      first_name: string;
      last_name: string;
      profile_image?: string;
    };
  }[];
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
  readonly CHUNK_SIZE = 1024 * 1024 * 2; // 2MB chunks
  showVideoModal = false;
  selectedVideo: Video | null = null;
  showDeleteVideoModal = false;
  videoToDelete: Video | null = null;
  showCommentBox: { [key: number]: boolean } = {};
  newComment = '';
  showLikesModal = false;
  selectedPostLikes: any[] = [];
  viewedVideos = new Set<number>();

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
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
      'Authorization': `Bearer ${token}`,
      'X-Profile-Page': 'true'
    });

    this.http.get<any>('http://localhost:8000/api/videos', { headers })
      .subscribe({
        next: (response) => {
          console.log('Videos response:', response);
          if (response && response.data) {
            this.videos = response.data;
          } else {
            this.videos = [];
          }
        },
        error: (error) => {
          console.error('Failed to load videos', error);
          this.videos = [];
        }
      });
  }

  goToEditProfile() {
    this.router.navigate(['/edit-profile']);
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
    if (this.playerData?.membership === 'Free' && (this.playerData?.monthly_video_count ?? 0) <= 0) {
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
    this.resetUploadForm();
    this.showUploadModal = false;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.uploadData.file = input.files[0];
    }
  }

  async uploadVideo() {
    if (!this.uploadData.file) {
      this.uploadError = 'Please select a video file';
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const file = this.uploadData.file;
    const formData = new FormData();
    if (this.uploadData.title) {
      formData.append('title', this.uploadData.title);
    }
    if (this.uploadData.description) {
      formData.append('description', this.uploadData.description);
    }
    formData.append('video', file);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    try {
      // Single request upload
      this.http.post<any>('http://localhost:8000/api/videos/upload', formData, {
        headers,
        reportProgress: true,
        observe: 'events'
      }).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.uploadProgress = Math.round(100 * event.loaded / event.total);
          } else if (event.type === HttpEventType.Response) {
            if (event.body.status === 'success') {
              // Update the video count from the response
              if (this.playerData && event.body.data.monthly_video_count !== undefined) {
                this.playerData.monthly_video_count = event.body.data.monthly_video_count;
              }

              // Refresh videos list
              this.fetchPlayerVideos();
              this.closeUploadModal();
              this.resetUploadForm();
            }
          }
        },
        error: (error) => {
          this.uploadError = error.error?.message || 'Failed to upload video';
          console.error('Upload error:', error);
        }
      });
    } catch (error) {
      this.uploadError = 'Upload failed. Please try again.';
      console.error('Upload error:', error);
    }
  }

  private resetUploadForm() {
    this.uploadData = {
      title: '',
      description: '',
      file: null
    };

    const fileInput = document.getElementById('video') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }

    this.uploadProgress = 0;
    this.uploadError = '';
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  deleteVideo(video: Video) {
    this.videoToDelete = video;
    this.showDeleteVideoModal = true;
  }

  closeDeleteVideoModal() {
    this.showDeleteVideoModal = false;
    this.videoToDelete = null;
  }

  confirmDeleteVideo() {
    if (!this.videoToDelete) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.delete(`http://localhost:8000/api/videos/${this.videoToDelete.id}`, { headers })
      .subscribe({
        next: () => {
          // Remove the video from the videos array
          this.videos = this.videos.filter(v => v.id !== this.videoToDelete?.id);
          this.closeDeleteVideoModal();
        },
        error: (error) => {
          console.error('Failed to delete video:', error);
          // You might want to show an error message to the user here
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
      transfer_status: this.playerData.transfer_status || '',
      membership: this.playerData.membership,
      monthly_video_count: this.playerData.monthly_video_count,
      last_count_reset: this.playerData.last_count_reset
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

  playVideo(video: Video) {
    this.selectedVideo = video;
    this.showVideoModal = true;

    // Add a small delay to wait for the video element to be created
    setTimeout(() => {
      const videoElement = document.querySelector('.video-player') as HTMLVideoElement;
      if (videoElement) {
        videoElement.addEventListener('play', () => this.onVideoPlay(new Event('play'), video.id));
      }
    }, 100);
  }

  closeVideoModal() {
    this.showVideoModal = false;
    this.selectedVideo = null;
  }

  goToHome() {
    this.router.navigate(['/home-feed']);
  }

  handleThumbnailError(event: Event, video: Video) {
    video.thumbnailError = true;
    // Remove the failed image
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  onVideoMetadataLoaded(event: Event, video: Video) {
    const videoElement = event.target as HTMLVideoElement;
    // Get a frame from the video as a thumbnail
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        // Convert the frame to a data URL and use it as the thumbnail
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg');
        video.thumbnail_url = thumbnailDataUrl;
        video.thumbnailError = false;

        // Clean up
        canvas.remove();
      }
    } catch (error) {
      console.error('Failed to generate thumbnail from video:', error);
    }

    // Update the video duration if not already set
    if (!video.duration && videoElement.duration) {
      video.duration = videoElement.duration;
    }
  }

  likeVideo(videoId: number) {
    if (!videoId) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.post(`http://localhost:8000/api/videos/${videoId}/like`, {}, { headers })
      .subscribe({
        next: (response: any) => {
          if (response.status === 'success') {
            // Update the video in both videos array and selectedVideo
            const video = this.videos.find(v => v.id === videoId);
            if (video) {
              video.has_liked = !video.has_liked;
              video.likes_count = response.data.likes_count;
            }
            if (this.selectedVideo?.id === videoId) {
              this.selectedVideo.has_liked = !this.selectedVideo.has_liked;
              this.selectedVideo.likes_count = response.data.likes_count;
            }
          }
        },
        error: (error) => {
          console.error('Error liking video:', error);
        }
      });
  }

  toggleCommentBox(videoId: number) {
    this.showCommentBox[videoId] = !this.showCommentBox[videoId];
  }

  postComment(videoId: number) {
    if (!videoId || !this.newComment.trim()) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.post(`http://localhost:8000/api/videos/${videoId}/comment`, {
      content: this.newComment.trim()
    }, { headers }).subscribe({
      next: (response: any) => {
        if (response.status === 'success' && response.data) {
          // Update the video in both videos array and selectedVideo
          const video = this.videos.find(v => v.id === videoId);
          if (video) {
            if (!video.comments) video.comments = [];
            video.comments.unshift(response.data);
            video.comments_count = (video.comments_count || 0) + 1;
          }
          if (this.selectedVideo?.id === videoId) {
            if (!this.selectedVideo.comments) this.selectedVideo.comments = [];
            this.selectedVideo.comments.unshift(response.data);
            this.selectedVideo.comments_count = (this.selectedVideo.comments_count || 0) + 1;
          }
          // Clear the input
          this.newComment = '';
        }
      },
      error: (error) => {
        console.error('Error posting comment:', error);
      }
    });
  }

  showLikesList(videoId: number, event: Event) {
    event.stopPropagation(); // Prevent like action from triggering
    const video = this.videos.find(v => v.id === videoId);
    if (video && video.likes) {
      this.selectedPostLikes = video.likes;
      this.showLikesModal = true;
    }
  }

  onVideoPlay(event: Event, videoId: number) {
    // Check if video has already been viewed in this session
    if (this.viewedVideos.has(videoId)) {
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.post(`http://localhost:8000/api/videos/${videoId}/view`, {}, { headers })
      .subscribe({
        next: (response: any) => {
          if (response.status === 'success') {
            // Find the video and update its view count
            const video = this.videos.find(v => v.id === videoId);
            if (video) {
              video.views = (video.views || 0) + 1;
              // Add to viewed videos set
              this.viewedVideos.add(videoId);
            }
            if (this.selectedVideo?.id === videoId) {
              this.selectedVideo.views = (this.selectedVideo.views || 0) + 1;
            }
          }
        },
        error: (error) => {
          console.error('Error incrementing video views:', error);
        }
      });
  }
}

