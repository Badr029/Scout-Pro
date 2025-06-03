import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface Player {
  user_id: number;
  profile_image: string | null;
  username: string;
  first_name: string;
  last_name: string;
  DateofBirth: string;
  phone_number: string;
  height: number;
  weight: number;
  preferred_foot: string;
  position: string;
  position_primary?: string;
  secondary_position: string[];
  gender: string;
  nationality: string;
  current_city: string;
  current_club: string;
  previous_clubs: string[];
  playing_style: string;
  transfer_status: string;
  bio: string | null;
  membership: string;
  age?: number;
  career?: { years: string; club: string; stats: string }[];
}

interface Video {
  title: string;
  thumbnail: string;
  url: string;
  channel: string;
  views: string;
  time: string;
  duration: string;
  avatar: string;
}

interface PlayerApiResponse {
  data: Player;
  age: number;
  videos: Video[];
}

@Component({
  selector: 'app-player-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-view.component.html',
  styleUrl: './player-view.component.css',
  encapsulation: ViewEncapsulation.None
})
export class PlayerViewComponent implements OnInit {
  loading: boolean = true;
  error: string | null = null;
  playerData: Player | null = null;
  videos: Video[] = [];
  safeVideoUrls: SafeResourceUrl[] = [];
  activeTab: string = 'about';
  playerId: string | null = null;

  private readonly BASE_API_URL = 'http://localhost:8000';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) {
    this.playerId = this.route.snapshot.paramMap.get('id');
  }

  ngOnInit(): void {
    this.fetchPlayerProfile();
  }

  fetchPlayerProfile(): void {
    this.loading = true;
    this.error = null;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const apiUrl = this.playerId
      ? `${this.BASE_API_URL}/api/player/${this.playerId}`
      : `${this.BASE_API_URL}/api/player/profile`;

    this.http.get<PlayerApiResponse>(apiUrl, { headers }).subscribe({
      next: (response) => {
        this.playerData = {
          ...response.data,
          age: response.age
        };

        this.videos = response.videos || [];

        this.safeVideoUrls = this.videos.map(video =>
          this.sanitizer.bypassSecurityTrustResourceUrl(video.url)
        );

        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching player profile:', error);
        this.error = error.error?.message || 'Failed to load player profile';
        this.loading = false;
      }
    });
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
  }

  goToHome(): void {
    this.router.navigate(['/home-feed']);
  }

  get playerImageUrl(): string {
    return this.playerData?.profile_image
      ? `${this.BASE_API_URL}/storage/${this.playerData.profile_image}`
      : 'assets/default-avatar.png';
  }

  getFirstInitial(): string {
    return this.playerData?.first_name?.charAt(0).toUpperCase() || '';
  }

  getLastInitial(): string {
    return this.playerData?.last_name?.charAt(0).toUpperCase() || '';
  }
}
