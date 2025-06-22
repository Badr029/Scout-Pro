import { Component, ViewEncapsulation, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';
import { ApiService } from '../../api.service';
import { ImageService } from '../../shared/services/image.service';
import { FeedService } from '../../services/feed.service';
import { ReportModalComponent } from '../../shared/components/report-modal/report-modal.component';

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
  scouting_regions: string[] | string;
  age_groups: string[] | string;
  preferred_roles: string[] | string;
  clubs_worked_with: string;
  linkedin_url?: string;
  id_proof?: string; // For admin API response
  id_proof_path?: string; // For profile API response
  certifications: string[] | string;
  provider?: string; // 'GOOGLE' or null/undefined for regular accounts
  user_id?: number;
  email?: string;
  user_type?: string;
}

interface ContactedPlayer {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  profile_image: string | null;
  position: string;
  nationality: string;
  current_city: string;
  membership: string;
  contact_date: string;
  contact_status: 'pending' | 'approved' | 'rejected';
  responded_at: string | null;
}

@Component({
  selector: 'app-scout-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReportModalComponent],
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
  contactedPlayersLoading = false;
  showDeleteConfirm = false;
  deletePassword = '';
  deleteConfirmation = '';
  deleteError = '';
  isGoogleAccount = false;
  showSettingsMenu = false;
  showPassword = false;
  Array = Array;

  // Report modal
  showReportModal = false;
  reportType: 'video' | 'user' | 'bug' = 'bug';
  reportItemId: number | null = null;

  @ViewChild(ReportModalComponent) reportModal: ReportModalComponent | undefined;

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private apiService: ApiService,
    public imageService: ImageService,
    private feedService: FeedService
  ) {}

  ngOnInit() {
    console.log('Scout Profile component initialized');
    this.fetchScoutProfile();
    if (this.activeTab === 'contacted') {
      this.fetchContactedPlayers();
    }

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
            if (response.data.provider === 'GOOGLE') {
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

  fetchContactedPlayers(): void {
    this.contactedPlayersLoading = true;
    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<{message: string, data: ContactedPlayer[]}>('http://localhost:8000/api/scout/contacted-players', { headers })
      .subscribe({
        next: (response) => {
          this.contactedPlayers = response.data;
          this.contactedPlayersLoading = false;
        },
        error: (error) => {
          console.error('Error fetching contacted players:', error);
          this.contactedPlayersLoading = false;
        }
      });
  }

  goToEditProfile() {
    this.router.navigate(['/scout/profile/edit']);
  }

  async logout() {
    try {
      await this.authService.logout();
      // Handle successful logout (e.g., redirect to login page)
    } catch (error) {
      console.error('Error during logout:', error);
      // Handle logout error
    }
  }

  showDeleteAccountModal() {
    this.showDeleteConfirm = true;
    this.deletePassword = '';
    this.deleteConfirmation = '';
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

    const requestData = this.isGoogleAccount ?
      { confirm_delete: this.deleteConfirmation } :
      { password: this.deletePassword };

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
    if (tab === 'contacted' && this.contactedPlayers.length === 0) {
      this.fetchContactedPlayers();
    }
  }

  normalizeProfileData() {
    if (this.scoutData) {
      // Handle scouting_regions
      if (typeof this.scoutData.scouting_regions === 'string') {
        try {
          const parsedRegions = JSON.parse(this.scoutData.scouting_regions);
          this.scoutData.scouting_regions = Array.isArray(parsedRegions) ? parsedRegions : [parsedRegions];
        } catch {
          this.scoutData.scouting_regions = (this.scoutData.scouting_regions as string).split(',').map(region => region.trim());
        }
      }

      // Handle age_groups
      if (typeof this.scoutData.age_groups === 'string') {
        try {
          const parsedGroups = JSON.parse(this.scoutData.age_groups);
          this.scoutData.age_groups = Array.isArray(parsedGroups) ? parsedGroups : [parsedGroups];
        } catch {
          this.scoutData.age_groups = (this.scoutData.age_groups as string).split(',').map(group => group.trim());
        }
      }

      // Handle preferred_roles
      if (typeof this.scoutData.preferred_roles === 'string') {
        try {
          const parsedRoles = JSON.parse(this.scoutData.preferred_roles);
          this.scoutData.preferred_roles = Array.isArray(parsedRoles) ? parsedRoles : [parsedRoles];
        } catch {
          this.scoutData.preferred_roles = (this.scoutData.preferred_roles as string).split(',').map(role => role.trim());
        }
      }

      // Handle certifications
      if (typeof this.scoutData.certifications === 'string') {
        try {
          const parsedCerts = JSON.parse(this.scoutData.certifications);
          this.scoutData.certifications = Array.isArray(parsedCerts) ? parsedCerts : [parsedCerts];
        } catch {
          this.scoutData.certifications = [];
        }
      }

      // Ensure all array fields are initialized
      if (!Array.isArray(this.scoutData.scouting_regions)) {
        this.scoutData.scouting_regions = [];
      }
      if (!Array.isArray(this.scoutData.age_groups)) {
        this.scoutData.age_groups = [];
      }
      if (!Array.isArray(this.scoutData.preferred_roles)) {
        this.scoutData.preferred_roles = [];
      }
      if (!Array.isArray(this.scoutData.certifications)) {
        this.scoutData.certifications = [];
      }

      console.log('Normalized scout data:', this.scoutData);
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

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  editProfile() {
    // Implement edit profile logic
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.handleClickOutside);
  }

  getArrayFromString(value: string | string[] | null | undefined): string[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  goToHome() {
    this.router.navigate(['/home-feed']);
  }

  getAvatarUrl(firstName: string, lastName: string): string {
    return `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`;
  }

  handleImageError(event: any, firstName: string, lastName: string): void {
    event.target.src = this.getAvatarUrl(firstName, lastName);
  }

  goToPlayerProfile(playerId: number): void {
    this.router.navigate(['/player', playerId]);
  }

  getContactStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return '';
    }
  }

  getContactStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Request Pending';
      case 'approved':
        return 'Contact Approved';
      case 'rejected':
        return 'Request Rejected';
      default:
        return 'Unknown Status';
    }
  }

  getProfileImageUrl(): string {
    return this.imageService.getProfileImageUrl(this.scoutData);
  }

  getDocumentUrl(documentPath: string): string {
    return this.imageService.getDocumentUrl(documentPath);
  }

  openReportModal(type: 'video' | 'user' | 'bug', itemId: number | null = null) {
    this.reportType = type;
    this.reportItemId = itemId;
    this.showReportModal = true;
  }

  closeReportModal() {
    this.showReportModal = false;
    this.reportItemId = null;
  }

  handleReportSubmit(formData: any) {
    if (!this.reportItemId && this.reportType !== 'bug') {
      this.reportModal?.showMessage('Invalid report data', 'error');
      return;
    }

    this.feedService.submitReport({
      type: this.reportType,
      item_id: this.reportItemId || 0,
      reason: formData.reason,
      description: formData.description,
      browser_info: this.reportType === 'bug' ? formData.browser_info : undefined
    }).subscribe({
      next: () => {
        this.reportModal?.showMessage('Report submitted successfully', 'success');
      },
      error: (error) => {
        console.error('Report submission error:', error);
        let errorMessage = 'Failed to submit report. Please try again later.';

        if (error.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (error.status === 422) {
          errorMessage = 'Invalid report data. Please check your input.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        this.reportModal?.showMessage(errorMessage, 'error');
      }
    });
  }
}

