import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { ApiService } from '../api.service';
import { FeedService } from '../services/feed.service';
import { ReportModalComponent } from '../shared/components/report-modal/report-modal.component';

interface ScoutProfile {
  id?: string;
  user_id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  profile_image?: string;
  position_title?: string;
  organization?: string;
  city?: string;
  country?: string;
  contact_email?: string;
  contact_phone?: string;
  scouting_regions?: string[];
  preferred_roles?: string[];
  linkedin_url?: string;
  age_groups?: string[];
  clubs_worked_with?: string;
  certifications?: string[];
  id_proof_path?: string;
}

@Component({
  selector: 'app-scout-view',
  standalone: true,
  imports: [CommonModule, ReportModalComponent],
  templateUrl: './scout-view.component.html',
  styleUrls: ['./scout-view.component.scss']
})
export class ScoutViewComponent implements OnInit {
  loading: boolean = true;
  error: string | null = null;
  scoutData: ScoutProfile | null = null;
  activeTab: string = 'about';
  isFollowing: boolean = false;
  followLoading: boolean = false;

  // Report modal
  showReportModal = false;
  reportType: 'video' | 'user' | 'bug' = 'user';
  reportItemId: number | null = null;
  notification = '';

  @ViewChild(ReportModalComponent) reportModal!: ReportModalComponent;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private apiService: ApiService,
    private feedService: FeedService
  ) {}

  ngOnInit(): void {
    this.fetchScoutProfile();
  }

  fetchScoutProfile(): void {
    this.loading = true;
    this.error = null;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const scoutId = this.route.snapshot.paramMap.get('id');
    const apiUrl = scoutId
      ? `http://localhost:8000/api/scout/${scoutId}`
      : 'http://localhost:8000/api/scout/profile';

    this.http.get<{ data: any }>(apiUrl, { headers }).subscribe({
      next: (response) => {
        if (response.data) {
          const scoutData = {
            ...response.data,
            // Process arrays that might come as strings
            scouting_regions: this.getArrayFromString(response.data.scouting_regions),
            preferred_roles: this.getArrayFromString(response.data.preferred_roles),
            age_groups: this.getArrayFromString(response.data.age_groups),
            certifications: Array.isArray(response.data.certifications) ? response.data.certifications : []
          };
          this.scoutData = scoutData;
          // After loading scout data, fetch follow status if user_id exists
          if (scoutData.user_id) {
            this.fetchFollowStatus(scoutData.user_id);
          }
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to load profile';
        this.loading = false;
      }
    });
  }

  fetchFollowStatus(userId: number): void {
    this.apiService.getFollowStatus(userId).subscribe({
      next: (response) => {
        this.isFollowing = response.following;
      },
      error: (error) => {
        console.error('Failed to fetch follow status:', error);
      }
    });
  }

  toggleFollow(): void {
    if (!this.scoutData?.user_id || this.followLoading) return;

    this.followLoading = true;
    const userId = this.scoutData.user_id;

    const action$ = this.isFollowing
      ? this.apiService.unfollowPlayer(userId)
      : this.apiService.followPlayer(userId);

    action$.subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.isFollowing = response.following;
        }
        this.followLoading = false;
      },
      error: (error) => {
        console.error('Failed to toggle follow:', error);
        this.followLoading = false;
      }
    });
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
  }

  getArrayFromString(value: any): string[] {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
  try {
        return JSON.parse(value);
  } catch {
    return value.split(',').map(item => item.trim());
  }
    }
    return [];
}

  // Helper methods to ensure arrays are always returned
  getScoutingRegions(): string[] {
    return this.scoutData?.scouting_regions || [];
  }

  getAgeGroups(): string[] {
    return this.scoutData?.age_groups || [];
  }

  getPreferredRoles(): string[] {
    return this.scoutData?.preferred_roles || [];
  }

  getCertifications(): string[] {
    return this.scoutData?.certifications || [];
  }

  goToHome(): void {
    this.router.navigate(['/home-feed']);
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
    if (!this.reportItemId) {
      this.reportModal?.showMessage('Invalid report data', 'error');
      return;
    }

    this.feedService.submitReport({
      type: this.reportType,
      item_id: this.reportItemId,
      reason: formData.reason,
      description: formData.description,
      browser_info: this.reportType === 'bug' ? formData.browser_info : undefined
    }).subscribe({
      next: (response) => {
        console.log('Report submitted successfully:', response);
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

  showNotification(message: string) {
    // Add notification property if it doesn't exist
    this.notification = message;
    setTimeout(() => {
      this.notification = '';
    }, 3000);
  }
}
