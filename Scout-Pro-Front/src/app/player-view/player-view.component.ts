import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { forkJoin, interval, Subscription } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';
import { ApiService } from '../api.service';

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
  id: number;
  title: string;
  description: string;
  file_path: string;
  thumbnail_url: string;
  views: number;
  likes_count: number;
  comments_count: number;
  duration: string;
  created_at: string;
  thumbnailError?: boolean;
  has_liked: boolean;
  comments?: Comment[];
  likeInProgress?: boolean;
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    profile_image?: string;
  };
}

interface PlayerApiResponse {
  data: Player;
  age: number;
  videos: Video[];
}

interface LikeResponse {
  status: string;
  data: {
    has_liked: boolean;
    likes_count: number;
  };
}

@Component({
  selector: 'app-player-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './player-view.component.html',
  styleUrl: './player-view.component.css',
  encapsulation: ViewEncapsulation.None
})
export class PlayerViewComponent implements OnInit, OnDestroy {
  private refreshInterval: Subscription | null = null;
  private componentActive = true;
  loading: boolean = true;
  error: string | null = null;
  playerData: Player | null = null;
  playerVideos: Video[] = [];
  activeTab: string = 'about';
  playerId: string | null = null;
  showVideoModal: boolean = false;
  selectedVideo: Video | null = null;
  showCommentBox: { [key: number]: boolean } = {};
  newComment: string = '';
  private viewedVideos = new Set<number>();
  userProfile: any = null;
  post: any = null;
  comments: any[] = [];
  isPlayer: boolean = false;
  isFollowing = false;
  currentUser: any = null;

  private readonly BASE_API_URL = 'http://localhost:8000';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private apiService: ApiService
  ) {
    this.playerId = this.route.snapshot.paramMap.get('id');
  }

  ngOnInit(): void {
    this.getCurrentUser();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.fetchPlayerProfile(params['id']);
        this.checkFollowStatus(params['id']);
      }
    });
    // Get user profile first
    this.getUserProfile();
    // Then fetch player profile
    this.fetchPlayerProfile();
    // Set up periodic refresh of like status
    this.refreshInterval = interval(10000) // Refresh every 10 seconds
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(() => {
        if (this.playerVideos.length > 0) {
          this.refreshLikeStatus();
          // Also refresh comments for the currently selected video
          if (this.selectedVideo) {
            this.fetchComments(this.selectedVideo.id);
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.componentActive = false;
    if (this.refreshInterval) {
      this.refreshInterval.unsubscribe();
    }
  }

  getCurrentUser() {
    this.currentUser = this.authService.getCurrentUser();
  }

  getUserProfile(): void {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get(`${this.BASE_API_URL}/api/profile`, { headers }).subscribe({
      next: (response: any) => {
        if (response.data) {
          this.userProfile = response.data;
          this.isPlayer = this.userProfile.user_type === 'player';
        }
      },
      error: (error) => {
        console.error('Error fetching user profile:', error);
        if (error.status === 401) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  fetchPlayerProfile(userId?: string): void {
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

    const apiUrl = userId
      ? `${this.BASE_API_URL}/api/player/${userId}`
      : `${this.BASE_API_URL}/api/player/profile`;

    this.http.get<PlayerApiResponse>(apiUrl, { headers }).subscribe({
      next: (response) => {
        // If we have data, update the component state
        if (response.data) {
          this.playerData = {
            ...response.data,
            age: response.age
          };

          // Initialize comments array for each video
          this.playerVideos = (response.videos || []).map(video => ({
            ...video,
            comments: video.comments || []
          }));

          // After getting videos, fetch their like status
          if (this.playerVideos.length > 0) {
            this.fetchVideoLikeStatus();
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching player profile:', error);
        // Only set error if we don't have any player data
        if (!this.playerData) {
          this.error = error.error?.message || 'Failed to load player profile';
        }
        this.loading = false;
      }
    });
  }

  fetchVideoLikeStatus(): void {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.playerVideos.forEach(video => {
      this.http.get<LikeResponse>(`${this.BASE_API_URL}/api/videos/${video.id}/like-status`, { headers })
        .subscribe({
          next: (response) => {
            video.has_liked = response.data.has_liked;
            video.likes_count = response.data.likes_count;

            // Update modal if this video is currently selected
            if (this.selectedVideo && this.selectedVideo.id === video.id) {
              this.selectedVideo.has_liked = response.data.has_liked;
              this.selectedVideo.likes_count = response.data.likes_count;
            }
          },
          error: (error) => {
            console.error(`Error fetching like status for video ${video.id}:`, error);
          }
        });
    });
  }

  handleImageError(event: any, firstName: string, lastName: string): void {
    event.target.src = `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`;
  }

  handleThumbnailError(event: any, video: Video): void {
    video.thumbnailError = true;
  }

  formatDuration(duration: string): string {
    return duration;
  }

  onVideoMetadataLoaded(event: any, video: Video): void {
    const videoElement = event.target;
    if (videoElement.duration) {
      const minutes = Math.floor(videoElement.duration / 60);
      const seconds = Math.floor(videoElement.duration % 60);
      video.duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  playVideo(video: Video): void {
    console.log('Playing video:', video);
    // Create a new object for selectedVideo to avoid reference issues
    this.selectedVideo = {
      ...video,
      comments: video.comments || []
    };
    this.showVideoModal = true;
    this.showCommentBox[video.id] = true;

    // Fetch comments when video is played
    this.fetchComments(video.id);

    // Record view only if not already viewed in this session
    if (!this.viewedVideos.has(video.id)) {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        this.router.navigate(['/login']);
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      this.http.post(`${this.BASE_API_URL}/api/videos/${video.id}/view`, {}, { headers })
        .subscribe({
          next: (response: any) => {
            if (response.status === 'success') {
              // Update view count in both the video card and modal
              const videoInList = this.playerVideos.find(v => v.id === video.id);
              if (videoInList) {
                videoInList.views = response.data.views;
              }
              if (this.selectedVideo && this.selectedVideo.id === video.id) {
                this.selectedVideo.views = response.data.views;
              }
              // Add to viewed videos set
              this.viewedVideos.add(video.id);
            }
          },
          error: (error) => {
            console.error('Error recording video view:', error);
          }
        });
    }
  }

  fetchComments(videoId: number): void {
    console.log('Fetching comments for video:', videoId);
    const token = localStorage.getItem('auth_token');
    if (!token || !this.selectedVideo) {
      console.log('No token or no selected video');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<{status: string, data: Comment[]}>(`${this.BASE_API_URL}/api/videos/${videoId}/comments`, { headers })
      .subscribe({
        next: (response) => {
          console.log('Comments API response:', response);
          if (response.status === 'success' && this.selectedVideo) {
            // Initialize comments array if needed
            if (!this.selectedVideo.comments) {
              this.selectedVideo.comments = [];
            }

            // Update the comments in the selected video
            this.selectedVideo.comments = response.data || [];
            this.selectedVideo.comments_count = (response.data || []).length;

            // Update the video in playerVideos list
            const videoInList = this.playerVideos.find(v => v.id === videoId);
            if (videoInList) {
              videoInList.comments = [...(response.data || [])];
              videoInList.comments_count = (response.data || []).length;
            }

            console.log('Updated selected video comments:', this.selectedVideo.comments);
            console.log('Updated video in list comments:', videoInList?.comments);
          }
        },
        error: (error) => {
          console.error('Error fetching comments:', error);
        }
      });
  }

  closeVideoModal(): void {
    this.showVideoModal = false;
    this.selectedVideo = null;
  }

  toggleCommentBox(videoId: number): void {
    this.showCommentBox[videoId] = !this.showCommentBox[videoId];
  }

  likeVideo(videoId: number): void {
    if (!videoId) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Find the video in both arrays
    const video = this.playerVideos.find(v => v.id === videoId);
    if (!video) return;

    // Determine if we're liking or unliking based on current state
    const endpoint = video.has_liked ? 'unlike' : 'like';

    this.http.post<LikeResponse>(`${this.BASE_API_URL}/api/videos/${videoId}/${endpoint}`, {}, { headers })
      .subscribe({
        next: (response) => {
          if (response.status === 'success') {
            // Update the video in the videos array
            if (video) {
              video.has_liked = response.data.has_liked;
              video.likes_count = response.data.likes_count;
            }

            // Update the selected video if it's the same one
            if (this.selectedVideo?.id === videoId) {
              this.selectedVideo.has_liked = response.data.has_liked;
              this.selectedVideo.likes_count = response.data.likes_count;
            }
          }
        },
        error: (error) => {
          console.error('Error toggling like:', error);
        }
      });
  }

  postComment(videoId: number): void {
    if (!this.newComment.trim() || !this.selectedVideo) {
      console.log('No comment content or no selected video');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.log('No auth token found');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const data = {
      content: this.newComment.trim()
    };

    console.log('Posting comment:', data);
    this.http.post<{status: string, data: Comment}>(`${this.BASE_API_URL}/api/videos/${videoId}/comment`, data, { headers })
      .subscribe({
        next: (response) => {
          console.log('Comment post response:', response);
          if (response.status === 'success' && this.selectedVideo) {
            // Initialize comments array if needed
            if (!this.selectedVideo.comments) {
              this.selectedVideo.comments = [];
            }

            // Add new comment to the beginning of the array
            this.selectedVideo.comments.unshift(response.data);
            this.selectedVideo.comments_count = this.selectedVideo.comments.length;

            // Update the video in the list
            const videoInList = this.playerVideos.find(v => v.id === videoId);
            if (videoInList) {
              videoInList.comments = [...this.selectedVideo.comments];
              videoInList.comments_count = this.selectedVideo.comments.length;
            }

            console.log('Updated comments after posting:', this.selectedVideo.comments);

            // Clear the input
            this.newComment = '';

            // Refresh comments to ensure consistency
            this.fetchComments(videoId);
          }
        },
        error: (error) => {
          console.error('Error posting comment:', error);
        }
      });
  }

  showLikesList(postId: number | undefined, event: Event): void {
    if (!postId) return;
    event.stopPropagation();
    // Implementation for showing likes list
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
  }

  goToHome(): void {
    this.router.navigate(['/home-feed']);
  }

  getFirstInitial(): string {
    return this.playerData?.first_name?.charAt(0).toUpperCase() || '';
  }

  getLastInitial(): string {
    return this.playerData?.last_name?.charAt(0).toUpperCase() || '';
  }

  refreshLikeStatus(): void {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const likeStatusRequests = this.playerVideos.map(video =>
      this.http.get<LikeResponse>(`${this.BASE_API_URL}/api/videos/${video.id}/like-status`, { headers })
    );

    forkJoin(likeStatusRequests).subscribe({
      next: (responses) => {
        responses.forEach((response, index) => {
          const video = this.playerVideos[index];
          if (video) {
            video.has_liked = response.data.has_liked;
            video.likes_count = response.data.likes_count;
            // Update modal if this video is currently selected
            if (this.selectedVideo && this.selectedVideo.id === video.id) {
              this.selectedVideo.has_liked = response.data.has_liked;
              this.selectedVideo.likes_count = response.data.likes_count;
            }
          }
        });
      },
      error: (error) => {
        console.error('Error refreshing like status:', error);
      }
    });
  }

  get canViewAnalytics(): boolean {
    return this.playerData?.membership === 'premium';
  }

  get isScout(): boolean {
    return this.userProfile?.user_type === 'scout';
  }

  goToSubscription(): void {
    this.router.navigate(['/subscription']);
  }

  checkFollowStatus(userId: string) {
    if (this.currentUser?.id === userId) return;

    this.apiService.getData(`users/${userId}/follow-status`).subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          this.isFollowing = response.following;
        }
      },
      error: (error: any) => {
        console.error('Error checking follow status:', error);
      }
    });
  }

  toggleFollow() {
    if (!this.playerData) return;

    const userId = this.playerData.user_id;
    const endpoint = this.isFollowing ? `users/${userId}/unfollow` : `users/${userId}/follow`;

    this.apiService.postData(endpoint, {}).subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          this.isFollowing = response.following;
          // Emit an event to update other components
          this.apiService.emitFollowStatusChanged({ userId, following: this.isFollowing });
        }
      },
      error: (error: any) => {
        console.error('Error toggling follow status:', error);
      }
    });
  }
}
