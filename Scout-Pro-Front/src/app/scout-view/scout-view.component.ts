import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';

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
  imports: [CommonModule],
  templateUrl: './scout-view.component.html',
  styleUrls: ['./scout-view.component.scss']
})
export class ScoutViewComponent implements OnInit {
  loading: boolean = true;
  error: string | null = null;
  scoutData: ScoutProfile | null = null;
  activeTab: string = 'about';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
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
          this.scoutData = {
            ...response.data,
            // Process arrays that might come as strings
            scouting_regions: this.getArrayFromString(response.data.scouting_regions),
            preferred_roles: this.getArrayFromString(response.data.preferred_roles),
            age_groups: this.getArrayFromString(response.data.age_groups),
            certifications: Array.isArray(response.data.certifications) ? response.data.certifications : []
          };
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to load profile';
        this.loading = false;
      }
    });
  }

  getArrayFromString(value: string | string[] | null | undefined): string[] {
  if (!value) return [];
    if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return value.split(',').map(item => item.trim());
  }
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

  switchTab(tab: string): void {
    this.activeTab = tab;
  }

  goToHome(): void {
    this.router.navigate(['/home-feed']);
  }
}
