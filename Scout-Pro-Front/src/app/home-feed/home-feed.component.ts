import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth.service';

const API_URL = 'http://localhost:8000';

interface FeedFilters {
  age_range?: string;
  preferred_foot?: string;
  region?: string;
  position?: string;
  playing_style?: string;
  min_age?: string;
  max_age?: string;
  transfer_status?: string;
}

interface FilterOption {
  value: string;
  label: string;
}

interface FilteredLists {
  positions: string[];
  regions: string[];
  ageRanges: any[];
  preferredFoot: any[];
  transferStatus: FilterOption[];
}

@Component({
  selector: 'app-home-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './home-feed.component.html',
  styleUrl: './home-feed.component.css'
})
export class HomeFeedComponent implements OnInit {
  feedData: any = {
    posts: {
      data: []
    },
    trending_players: [],
    upcoming_events: [],
    recommendations: [],
    suggested_searches: []
  };
  filters: any = {
    location: '',
    position: '',
    secondary_position: '',
    region: '',
    age: '',
    height: '',
    preferred_foot: '',
    playing_style: '',
    transfer_status: ''
  };
  loading = true;
  error = '';
  notification = '';
  currentYear = new Date().getFullYear();
  searchQuery: string = '';
  showFilters = false;
  showSearchPanel = false;
  activeView: 'feed' | 'events' = 'feed';
  showCommentBox: { [key: number]: boolean } = {};
  newComment: string = '';
  uploadModalOpen = false;
  uploadProgress = 0;
  uploadData = {
    title: '',
    description: '',
    file: null as File | null
  };
  uploadError = '';
  userProfile: any = null;
  currentUser: any = null;
  showLikesModal = false;
  selectedPostLikes: any[] = [];
  readonly CHUNK_SIZE = 1024 * 1024 * 2; // 2MB chunks
  private viewedVideos = new Set<number>();
  sidebarExpanded = false;
  searchResults: any[] = [];
  recentSearches: string[] = [];
  private _isInitialScout: boolean = false;
  showAccountMenu = false;
  isMobile = false;
  showRightPanel = false;

  // Filter Options
  ageRanges = [
    { value: '15-18', label: '15-18 years' },
    { value: '19-23', label: '19-23 years' },
    { value: '24-28', label: '24-28 years' },
    { value: '29-35', label: '29+ years' }
  ];

  preferredFootOptions = [
    { value: 'right', label: 'Right Foot' },
    { value: 'left', label: 'Left Foot' },
    { value: 'both', label: 'Both Feet' }
  ];

  positions = [
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

  regions = [
    'Cairo',
    'Alexandria',
    'Giza',
    'Qalyubia',
    'Gharbia',
    'Menoufia',
    'Dakahlia',
    'Sharqia',
    'Port Said',
    'Damietta',
    'Ismailia',
    'Suez',
    'North Sinai',
    'South Sinai',
    'Beheira',
    'Kafr El Sheikh',
    'Matrouh',
    'Red Sea',
    'New Valley',
    'Fayoum',
    'Beni Suef',
    'Minya',
    'Assiut',
    'Sohag',
    'Qena',
    'Luxor',
    'Aswan'
  ];

  transferStatusOptions: FilterOption[] = [
    { value: 'available', label: 'Available' },
    { value: 'not_available', label: 'Not Available' },
    { value: 'loan', label: 'Loan' }
  ];

  showFeedFilter = false;
  feedFilters: FeedFilters = {
    age_range: '',
    preferred_foot: '',
    region: '',
    position: '',
    playing_style: '',
    transfer_status: ''
  };

  // Position suggestions
  filteredPositions: string[] = [];
  showPositionSuggestions: boolean = false;
  selectedSuggestionIndex: number = -1;

  // Search terms for each dropdown
  searchTerms = {
    position: '',
    region: '',
    age: '',
    foot: '',
    status: ''
  };

  // Filtered lists
  filteredLists: FilteredLists = {
    positions: [] as string[],
    regions: [] as string[],
    ageRanges: [] as any[],
    preferredFoot: [] as any[],
    transferStatus: [] as FilterOption[]
  };

  constructor(
    private router: Router,
    private apiService: ApiService,
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('HomeFeedComponent constructor');
    const userType = localStorage.getItem('user_type');
    console.log('User type from localStorage:', userType);
    this._isInitialScout = this.authService.getUserType() === 'scout';
    this.checkMobileView();
    window.addEventListener('resize', () => this.checkMobileView());
  }

  ngOnInit() {
    console.log('HomeFeedComponent ngOnInit');
    // Get user data first
    this.getUserProfile();
    // Then load other data
    this.loadFeedData();
    this.loadRecentSearches();
    this.initializeFilteredLists();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', () => this.checkMobileView());
  }

  private checkMobileView() {
    this.isMobile = window.innerWidth <= 768;
  }

  getUserProfile() {
    console.log('Getting user profile...');
    const userType = localStorage.getItem('user_type');
    console.log('User type when getting profile:', userType);

    if (!userType) {
      console.error('No user type found in localStorage');
      localStorage.clear();
      this.router.navigate(['/login']);
      return;
    }

    this.apiService.getUserProfile().subscribe({
      next: (response: any) => {
        console.log('User profile response:', response);
        if (response.data) {
          this.userProfile = response.data;

          // Handle scout profile data structure
          if (userType === 'scout') {
            this.currentUser = {
              id: response.data.user_id || response.data.id,
              name: `${response.data.first_name} ${response.data.last_name}`,
              profile_image: response.data.profile_image
                ? `${API_URL}/storage/${response.data.profile_image}`
                : null,
              user_type: userType,
              scout_id: response.data.scout_id || response.data.id,
              role: response.data.role || 'scout'
            };
          } else {
            // Handle player profile data structure
            this.currentUser = {
              id: response.data.user_id || response.data.id,
              name: `${response.data.first_name} ${response.data.last_name}`,
              profile_image: response.data.profile_image
                ? `${API_URL}/storage/${response.data.profile_image}`
                : null,
              user_type: userType,
              player_id: response.data.player_id || response.data.id,
              role: response.data.role
            };
          }

          console.log('Current user data after setup:', this.currentUser);
        }
      },
      error: (error: any) => {
        console.error('Error fetching user profile:', error);
        if (error.status === 401 || error.status === 404) {
          console.log('Authentication error or profile not found, redirecting to login');
          localStorage.clear();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  loadFeedData() {
    this.loading = true;
    this.error = '';

    // Debug log for current user
    console.log('Current authenticated user:', this.currentUser);

    this.apiService.getData('videos').subscribe({
      next: (response: any) => {
        console.log('Raw video response:', response);
        if (response.data) {
          // Process videos data
          const processedVideos = response.data.map((video: any) => {
            // Debug logs
            console.log('Processing video user:', video.user);
            console.log('Video user ID (users table):', video.user.id);
            console.log('Video user ID (players table):', video.user.player?.id);
            console.log('Current user ID (users table):', this.currentUser?.id);
            console.log('Current user player ID:', this.userProfile?.id);

            return {
              id: video.id,
              title: video.title,
              description: video.description,
              file_path: video.file_path ? `${API_URL}/storage/${video.file_path}` : null,
              thumbnail: video.thumbnail ? `${API_URL}/storage/${video.thumbnail}` : null,
                user: {
                id: video.user.id,
                player_id: video.user.player?.id,
                first_name: video.user.first_name,
                last_name: video.user.last_name,
                profile_image: video.user.profile_image,
                full_name: video.user.full_name,
                user_type: video.user.user_type,
                player: video.user.player,
                isCurrentUser: video.user.id === this.currentUser?.id
              },
              likes_count: video.likes_count || 0,
              comments_count: video.comments?.length || 0,
              views: video.views || 0,
              has_liked: video.has_liked || false,
              likes: video.likes || [],
              comments: video.comments || [],
              created_at: video.created_at
            };
          });

          this.feedData = {
            ...this.feedData,
            posts: {
              data: processedVideos,
              current_page: response.current_page || 1,
              last_page: response.last_page || 1
            }
          };
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading videos:', error);
        this.error = 'Failed to load feed data';
        this.loading = false;
      }
    });

    // Load trending players
    this.apiService.getData('trending-players').subscribe({
      next: (response: any) => {
        console.log('Trending players response:', response); // Debug log
        if (response.data) {
          this.feedData.trending_players = response.data.map((player: any) => ({
            id: player.id,
            name: `${player.first_name || ''} ${player.last_name || ''}`.trim(),
            position: player.position || 'No Position',
            region: player.region || 'No Region',
            profile_image: player.profile_image // Already includes full URL from backend
          }));
        }
      },
      error: (error) => console.error('Error loading trending players:', error)
    });
  }

  getProfileImageUrl(profileImage: string | null | undefined): string {
    if (!profileImage) {
      return ''; // Or return a default image URL
    }
    // Check if the URL is already complete
    if (profileImage.startsWith('http')) {
      return profileImage;
    }
    // Remove any double slashes except for http(s)://
    return `${API_URL}/storage/${profileImage.replace(/^\/+/, '')}`;
  }

  goToProfile() {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    console.log('Navigating to profile. Current user:', this.currentUser);
    console.log('User type:', this.currentUser.user_type);
    console.log('Is Scout:', this.isScout);

    // Navigate based on user type
    if (this.currentUser.user_type === 'scout' || this.isScout) {
      this.router.navigate(['/scout/profile']);
    } else {
      this.router.navigate(['/profile']);
    }
  }

  goToUserProfile(userId: number) {
    if (!userId) return;

    if (userId === this.currentUser?.id) {
      this.goToProfile(); // Use the existing goToProfile method for current user
    } else {
      // If it's another user, determine their type and navigate accordingly
      const user = this.findUserInFeed(userId);
      if (user?.user_type === 'scout') {
        this.router.navigate(['/scout/profile', userId]);
      } else {
        this.router.navigate(['/player', userId]);
      }
    }
  }

  goToPlayerProfile(playerId: number) {
    if (!playerId) return;

    if (playerId === this.currentUser?.id) {
      this.goToProfile(); // Use the existing goToProfile method for current user
          } else {
      this.router.navigate(['/player', playerId]);
    }
  }

  goToScoutProfile(scoutId: number) {
    if (!scoutId) return;

    // Check if the scout ID matches the current user's ID
    if (this.currentUser?.user_type === 'scout' && scoutId === this.currentUser?.id) {
      this.router.navigate(['/scout/profile']); // Navigate to own profile
    } else {
      this.router.navigate(['/scout', scoutId]); // Navigate to scout view page
    }
  }

  // Helper method to find a user in the feed data
  private findUserInFeed(userId: number): any {
    // Check in posts
    for (const post of this.feedData.posts.data) {
      if (post.user.id === userId) {
        return post.user;
      }
    }
    // Check in likes if modal is open
    if (this.selectedPostLikes) {
      const like = this.selectedPostLikes.find(like => like.user.id === userId);
      if (like) {
        return like.user;
      }
    }
    return null;
  }

  followPlayer(playerId: number) {
    if (!playerId || playerId === this.currentUser?.id) return;

    this.apiService.postData(`users/${playerId}/follow`, {}).subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          // Update following status in posts
          this.feedData.posts.data = this.feedData.posts.data.map((post: any) => {
            if (post.user.id === playerId) {
              return {
                ...post,
                user: {
                  ...post.user,
                  following: true
                }
              };
            }
            return post;
          });

          // Update following status in likes if modal is open
          if (this.selectedPostLikes) {
            this.selectedPostLikes = this.selectedPostLikes.map((like: any) => {
              if (like.user.id === playerId) {
                return {
                  ...like,
                  user: {
                    ...like.user,
                    following: true
                  }
                };
              }
              return like;
            });
          }

          this.showNotification('Successfully followed user');
        }
      },
      error: (error: any) => {
        console.error('Error following user:', error);
        this.showNotification('Failed to follow user');
      }
    });
  }

  unfollowPlayer(playerId: number) {
    if (!playerId || playerId === this.currentUser?.id) return;

    this.apiService.postData(`users/${playerId}/unfollow`, {}).subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          // Update following status in posts
          this.feedData.posts.data = this.feedData.posts.data.map((post: any) => {
            if (post.user.id === playerId) {
              return {
                ...post,
                user: {
                  ...post.user,
                  following: false
                }
              };
            }
            return post;
          });

          // Update following status in likes if modal is open
          if (this.selectedPostLikes) {
            this.selectedPostLikes = this.selectedPostLikes.map((like: any) => {
              if (like.user.id === playerId) {
                return {
                  ...like,
                  user: {
                    ...like.user,
                    following: false
                  }
                };
              }
              return like;
            });
          }

          this.showNotification('Successfully unfollowed user');
        }
      },
      error: (error: any) => {
        console.error('Error unfollowing user:', error);
        this.showNotification('Failed to unfollow user');
      }
    });
  }

  likePost(postId: number) {
    if (!postId) return;

    const post = this.feedData.posts.data.find((p: any) => p.id === postId);
    if (!post) return;

    this.apiService.postData(`videos/${postId}/like`, {}).subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          // Update the post's like status
          post.has_liked = response.data.has_liked;
          post.likes_count = response.data.likes_count;

          // Fetch fresh likes data to ensure we have the latest state
          this.apiService.getVideoLikes(postId).subscribe({
            next: (likesResponse: any) => {
              if (likesResponse.data) {
                // Process the likes data
                const processedLikes = likesResponse.data.map((like: any) => ({
                  id: like.id,
                  user: {
                    id: like.user.id,
                    first_name: like.user.first_name,
                    last_name: like.user.last_name,
                    full_name: `${like.user.first_name} ${like.user.last_name}`.trim(),
                    profile_image: like.user.profile_image,
                    user_type: like.user.user_type,
                    player: like.user.player,
                    following: like.user.following || false
                  }
                }));

                post.likes = processedLikes;
                // Update selectedPostLikes if the likes modal is open for this post
                if (this.showLikesModal && this.selectedPostLikes) {
                  this.selectedPostLikes = processedLikes;
                }
              }
            },
            error: (error: any) => {
              console.error('Error fetching updated likes:', error);
            }
          });
        }
      },
      error: (error: any) => {
        console.error('Error toggling like:', error);
        this.showNotification('Failed to update like status');
      }
    });
  }

  postComment(postId: number) {
    if (!postId || !this.newComment.trim()) return;

    this.apiService.postData(`videos/${postId}/comment`, {
      content: this.newComment.trim()
    }).subscribe({
      next: (response: any) => {
        if (response.status === 'success' && response.data) {
          const post = this.feedData.posts.data.find((p: any) => p.id === postId);
          if (post) {
            // Create new comment object with proper structure
            const newComment = {
              id: response.data.id,
              content: response.data.content,
              created_at: response.data.created_at,
              user_id: response.data.user_id,
              user: response.data.user
            };

            // Initialize comments array if it doesn't exist
            if (!post.comments) {
              post.comments = [];
            }

            // Add new comment to the beginning of the array
            post.comments.unshift(newComment);
            post.comments_count = (post.comments_count || 0) + 1;

            // Clear the input
            this.newComment = '';
            this.showNotification('Comment posted successfully');
          }
        } else {
          this.showNotification('Failed to post comment');
        }
      },
      error: (error: any) => {
        console.error('Error posting comment:', error);
        this.showNotification('Failed to post comment');
      }
    });
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
    const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);
    this.uploadProgress = 0;

    try {
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * this.CHUNK_SIZE;
        const end = Math.min(start + this.CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        if (this.uploadData.title) {
        formData.append('title', this.uploadData.title);
        }
        if (this.uploadData.description) {
        formData.append('description', this.uploadData.description);
        }
        formData.append('video', chunk);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('totalChunks', totalChunks.toString());
        formData.append('fileName', file.name);

        await new Promise<void>((resolve, reject) => {
          this.apiService.uploadVideoChunk(formData).subscribe({
            next: () => {
              this.uploadProgress = Math.round((chunkIndex + 1) * 100 / totalChunks);
              resolve();
            },
            error: (error) => {
              this.uploadError = error.error?.message || 'Failed to upload video chunk';
              reject(error);
            }
          });
        });
      }

      // Final step - tell server to combine chunks
      const finalizeData = {
        fileName: file.name,
        totalChunks: totalChunks,
        title: this.uploadData.title || '',
        description: this.uploadData.description || ''
      };

      this.apiService.finalizeVideoUpload(finalizeData).subscribe({
        next: () => {
          this.closeUploadModal();
          this.loadFeedData(); // Reload feed to show new video
          this.showNotification('Video uploaded successfully');
        },
        error: (error) => {
          this.uploadError = error.error?.message || 'Failed to finalize video upload';
      }
      });

    } catch (error) {
      console.error('Upload error:', error);
      this.uploadError = 'Upload failed. Please try again.';
    }
  }

  openUploadModal() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.uploadModalOpen = true;
    this.uploadData = {
      title: '',
      description: '',
      file: null
    };
    this.uploadProgress = 0;
    this.uploadError = '';
  }

  closeUploadModal() {
    this.uploadModalOpen = false;
    this.uploadData = {
      title: '',
      description: '',
      file: null
    };
    this.uploadProgress = 0;
    this.uploadError = '';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];

      // Check file size (100MB limit)
      const maxSize = 100 * 1024 * 1024; // 100MB in bytes
      if (file.size > maxSize) {
        this.uploadError = 'File size must be less than 100MB';
        input.value = ''; // Clear the file input
        return;
      }

      // Check file type
      if (!file.type.startsWith('video/')) {
        this.uploadError = 'Please select a valid video file';
        input.value = ''; // Clear the file input
        return;
      }

      this.uploadData.file = file;
      this.uploadError = ''; // Clear any previous errors
    }
  }

  searchForTerm(term: string) {
    console.log('Searching for term:', term); // Debug log
    this.searchQuery = term;
    this.onSearch();
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.filters = {
      age_range: '',
      preferred_foot: '',
      region: '',
      transfer_status: ''
    };
    this.showPositionSuggestions = false;
    this.selectedSuggestionIndex = -1;
  }

  goToEvent(eventId: number) {
    this.router.navigate(['/event', eventId]);
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 200) {
      if (!this.loading) {
        this.loadMore();
      }
    }
  }

  loadMore() {
    if (this.feedData.posts.current_page >= this.feedData.posts.last_page) {
      return;
    }

    this.loading = true;
    const nextPage = this.feedData.posts.current_page + 1;

    this.apiService.getData(`feed?page=${nextPage}`).subscribe({
      next: (response: any) => {
        if (response.data?.posts?.data) {
          // Process and append new posts
          const newPosts = response.data.posts.data.map((post: any) => ({
            ...post,
            file_path: post.file_path ? `http://localhost:8000/storage/${post.file_path}` : null,
            thumbnail: post.thumbnail ? `http://localhost:8000/storage/${post.thumbnail}` : null,
            user: {
              ...post.user,
              profile_image: post.user?.profile_image ? `http://localhost:8000/storage/${post.user.profile_image}` : null
            }
          }));

          this.feedData.posts.data = [...this.feedData.posts.data, ...newPosts];
          this.feedData.posts.current_page = response.data.posts.current_page;
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading more posts:', error);
        this.loading = false;
      }
    });
  }

  showLikesList(postId: number, event: Event) {
    event.stopPropagation(); // Prevent like action from triggering
    const post = this.feedData.posts.data.find((p: any) => p.id === postId);
    if (post) {
      // Show loading state
      this.loading = true;

      // Fetch fresh likes data from the API
      this.apiService.getData(`videos/${postId}/likes`).subscribe({
        next: (response: any) => {
          if (response.data) {
            // Process the likes data to ensure all required fields are present
            const processedLikes = response.data.map((like: any) => ({
              id: like.id,
              user: {
                id: like.user.id,
                first_name: like.user.first_name,
                last_name: like.user.last_name,
                full_name: `${like.user.first_name} ${like.user.last_name}`.trim(),
                profile_image: like.user.profile_image,
                user_type: like.user.user_type,
                role: like.user.role,
                player: like.user.player,
                following: like.user.following || false,
                isCurrentUser: like.user.id === this.currentUser?.id
              }
            }));

            // Update the post's likes with fresh data
            post.likes = processedLikes;
            this.selectedPostLikes = processedLikes;
      this.showLikesModal = true;
          }
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error fetching likes:', error);
          this.showNotification('Failed to load likes. Please try again.');
          this.loading = false;
          this.showLikesModal = false; // Close modal on error
        }
      });
    }
  }

  closeLikesModal() {
    this.showLikesModal = false;
    this.selectedPostLikes = [];
  }

  incrementVideoViews(postId: number) {
    // Check if video has already been viewed in this session
    if (this.viewedVideos.has(postId)) {
      return;
    }

    this.apiService.postData(`videos/${postId}/view`, {}).subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          // Find the post and update its view count
          const post = this.feedData.posts.data.find((p: any) => p.id === postId);
          if (post) {
            post.views = (post.views || 0) + 1;
            // Add to viewed videos set
            this.viewedVideos.add(postId);
          }
        }
      },
      error: (error: any) => {
        console.error('Error incrementing video views:', error);
      }
    });
  }

  onVideoPlay(event: Event, postId: number) {
    this.incrementVideoViews(postId);
  }

  get isPlayer(): boolean {
    const isPlayerType = this.currentUser?.user_type === 'player';
    const isPlayerID = this.currentUser?.player_id && this.currentUser.player_id >= 1000000 && this.currentUser.player_id < 2000000;
    console.log('isPlayer check:', {
      userType: this.currentUser?.user_type,
      userId: this.currentUser?.id,
      playerId: this.currentUser?.player_id,
      isPlayerType,
      isPlayerID
    });
    return isPlayerType || isPlayerID;
  }

  get isScout(): boolean {
    const isScoutType = this.currentUser?.user_type === 'scout';
    const isScoutID = this.currentUser?.scout_id && this.currentUser.scout_id >= 2000000;
    console.log('isScout check:', {
      userType: this.currentUser?.user_type,
      userId: this.currentUser?.id,
      scoutId: this.currentUser?.scout_id,
      isScoutType,
      isScoutID
    });
    return isScoutType || isScoutID;
  }

  onFilterChange(key: string, value: string) {
    this.filters[key] = value;
    if (this.searchQuery.trim()) {
      this.onSearch();
    }
  }

  toggleFilter() {
    this.showFilters = !this.showFilters;
  }

  onSearch() {
    if (!this.searchQuery.trim()) return;

    console.log('Performing search with query:', this.searchQuery);
    this.loading = true;

    // Save the search term to localStorage first
    let recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    if (!recentSearches.includes(this.searchQuery.trim())) {
      recentSearches.unshift(this.searchQuery.trim());
      recentSearches = recentSearches.slice(0, 10); // Keep only last 10 searches
      localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
      this.recentSearches = recentSearches;
    }

    const searchData = {
      query: this.searchQuery,
      filters: this.isScout ? this.filters : {}
    };

    this.apiService.postData('search', searchData).subscribe({
      next: (response: any) => {
        console.log('Search response:', response);
        // Update to use results instead of players
        this.searchResults = response.data.results || [];

        // Process each result to ensure proper image URLs
        this.searchResults = this.searchResults.map((result: any) => ({
          ...result,
          profile_image: result.profile_image ? this.getProfileImageUrl(result.profile_image) : null,
          full_name: `${result.first_name} ${result.last_name}`.trim()
        }));

        console.log('Processed search results:', this.searchResults);

        if (response.data.filter_options) {
          this.feedData.filter_options = response.data.filter_options;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Search error:', error);
        this.loading = false;
        this.showNotification('Failed to perform search');
      }
    });
  }

  toggleSearchPanel() {
    this.showSearchPanel = !this.showSearchPanel;
    if (this.showSearchPanel) {
      this.loadRecentSearches();
    }
  }

  showNotification(message: string) {
    this.notification = message;
    setTimeout(() => this.notification = '', 3000);
  }

  getAvatarUrl(firstName?: string, lastName?: string): string {
    const name = ((firstName || '') + ' ' + (lastName || '')).trim() || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
  }

  handleImageError(event: Event, firstName?: string, lastName?: string): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      imgElement.src = this.getAvatarUrl(firstName, lastName);
    }
  }

  toggleCommentBox(postId: number) {
    this.showCommentBox[postId] = !this.showCommentBox[postId];
  }

  expandSidebar() {
    this.sidebarExpanded = true;
  }

  collapseSidebar() {
    if (!this.showSearchPanel && !this.showAccountMenu) {
      this.sidebarExpanded = false;
    }
  }

  switchView(view: 'feed' | 'events') {
    this.activeView = view;
  }

  // Add a method to handle video errors
  onVideoError(event: any) {
    console.error('Video loading error:', event);
    const videoElement = event.target;
    // Try to reload the video
    videoElement.load();
  }

  // Add a method to get the complete video URL
  getVideoUrl(filePath: string | null): string {
    if (!filePath) return '';
    if (filePath.startsWith('http')) {
      return filePath;
    }
    return `${API_URL}/storage/${filePath.replace(/^\/+/, '')}`;
  }

  loadRecentSearches() {
    // Load from localStorage
    const searches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    this.recentSearches = searches;
    console.log('Loaded recent searches:', this.recentSearches);
  }

  deleteRecentSearch(search: string): void {
    console.log('Deleting search term:', search);

    // Remove from localStorage
    let searches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    searches = searches.filter((s: string) => s !== search);
    localStorage.setItem('recentSearches', JSON.stringify(searches));

    // Update the UI
    this.recentSearches = searches;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const searchContainer = document.querySelector('.search-input-container');
    if (searchContainer && !searchContainer.contains(event.target as Node)) {
      this.showPositionSuggestions = false;
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (!this.showPositionSuggestions) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedSuggestionIndex = Math.min(
          this.selectedSuggestionIndex + 1,
          this.filteredPositions.length - 1
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.selectedSuggestionIndex >= 0) {
          this.selectPosition(this.filteredPositions[this.selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        this.showPositionSuggestions = false;
        break;
    }
  }

  onSearchInput(event: KeyboardEvent) {
    if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(event.key)) return;

    const query = this.searchQuery.toLowerCase();
    this.filteredPositions = this.positions.filter(position =>
      position.toLowerCase().includes(query)
    );

    this.showPositionSuggestions = this.filteredPositions.length > 0 && query.length > 0;
    this.selectedSuggestionIndex = -1;
  }

  selectPosition(position: string) {
    this.searchQuery = position;
    this.showPositionSuggestions = false;
    this.onSearch();
  }

  toggleFeedFilter() {
    this.showFeedFilter = !this.showFeedFilter;
    if (this.showFeedFilter) {
      // Get the feed container element
      const feedContainer = document.querySelector('.reels-container');
      if (feedContainer) {
        feedContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  applyFeedFilters() {
    this.loading = true;

    const filters: FeedFilters = { ...this.feedFilters };
    // Remove empty filters
    Object.entries(filters).forEach(([key, value]) => {
      if (!value) {
        delete (filters as any)[key];
      }
    });

    // Add age calculation for backend
    if (filters.age_range) {
      const [minAge, maxAge] = filters.age_range.split('-');
      filters.min_age = minAge;
      filters.max_age = maxAge || '100'; // If no max age specified
      delete filters.age_range;
    }

    // Map frontend filter names to backend filter names
    interface MappedFilters {
      [key: string]: string | undefined;
    }

    const mappedFilters: MappedFilters = {
      player_position: filters.position,
      preferred_foot: filters.preferred_foot?.toLowerCase(),
      region: filters.region,
      playing_style: filters.playing_style?.toLowerCase(),
      min_age: filters.min_age,
      max_age: filters.max_age,
      transfer_status: filters.transfer_status
    };

    // Remove undefined or null values
    Object.keys(mappedFilters).forEach(key => {
      if (!mappedFilters[key]) {
        delete mappedFilters[key];
      }
    });

    console.log('Applied filters:', mappedFilters);

    // Get all videos first
    this.apiService.getData('videos').subscribe({
      next: (response: any) => {
        if (response.data) {
          // Filter videos based on player attributes
          let filteredVideos = response.data.filter((video: any) => {
            const player = video.user?.player;
            if (!player) {
              console.log('No player data found for video:', video);
              return false;
            }

            console.log('Checking player:', player);
            console.log('Against filters:', mappedFilters);

            // Check each filter condition
            if (mappedFilters['player_position'] && player.position !== mappedFilters['player_position']) {
              console.log('Position mismatch:', player.position, mappedFilters['player_position']);
              return false;
            }
            if (mappedFilters['preferred_foot'] && player.preferred_foot?.toLowerCase() !== mappedFilters['preferred_foot']) {
              console.log('Preferred foot mismatch:', player.preferred_foot?.toLowerCase(), mappedFilters['preferred_foot']);
              return false;
            }
            if (mappedFilters['region'] && player.region !== mappedFilters['region']) {
              console.log('Region mismatch:', player.region, mappedFilters['region']);
              return false;
            }
            if (mappedFilters['transfer_status'] && player.transfer_status?.toLowerCase() !== mappedFilters['transfer_status']) {
              console.log('Transfer status mismatch:', player.transfer_status?.toLowerCase(), mappedFilters['transfer_status']);
              return false;
            }
            // Age filter using the calculated age from the backend
            if (mappedFilters['min_age'] || mappedFilters['max_age']) {
              const playerAge = Math.abs(player.age); // Use absolute value since age is negative
              console.log('Age check:', playerAge, mappedFilters['min_age'], mappedFilters['max_age']);
              if (mappedFilters['min_age'] && playerAge < parseInt(mappedFilters['min_age'])) {
                console.log('Age below minimum:', playerAge, mappedFilters['min_age']);
                return false;
              }
              if (mappedFilters['max_age'] && playerAge > parseInt(mappedFilters['max_age'])) {
                console.log('Age above maximum:', playerAge, mappedFilters['max_age']);
                return false;
              }
            }

            console.log('Player matches all filters');
            return true;
          });

          console.log('Filtered videos:', filteredVideos);

          // Process the filtered videos
          const processedVideos = filteredVideos.map((video: any) => ({
            id: video.id,
            title: video.title,
            description: video.description,
            file_path: video.file_path ? `${API_URL}/storage/${video.file_path}` : null,
            thumbnail: video.thumbnail ? `${API_URL}/storage/${video.thumbnail}` : null,
            user: {
              id: video.user.id,
              player_id: video.user.player?.id,
              first_name: video.user.first_name,
              last_name: video.user.last_name,
              profile_image: video.user.profile_image,
              full_name: video.user.full_name,
              user_type: video.user.user_type,
              player: video.user.player,
              isCurrentUser: video.user.id === this.currentUser?.id
            },
            likes_count: video.likes_count || 0,
            comments_count: video.comments?.length || 0,
            views: video.views || 0,
            has_liked: video.has_liked || false,
            likes: video.likes || [],
            comments: video.comments || [],
            created_at: video.created_at
          }));

          this.feedData = {
            ...this.feedData,
            posts: {
              data: processedVideos,
              current_page: 1,
              last_page: 1
            }
          };
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error applying filters:', error);
        this.error = 'Failed to apply filters';
        this.loading = false;
      }
    });
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  clearFeedFilters() {
    this.feedFilters = {
      age_range: '',
      preferred_foot: '',
      region: '',
      position: '',
      playing_style: '',
      transfer_status: ''
    };

    // Reset search terms and filtered lists
    Object.keys(this.searchTerms).forEach(key => {
      this.searchTerms[key as keyof typeof this.searchTerms] = '';
    });
    this.initializeFilteredLists();

    this.loadFeedData();
  }

  private initializeFilteredLists() {
    this.filteredLists.positions = [...this.positions];
    this.filteredLists.regions = [...this.regions];
    this.filteredLists.ageRanges = [...this.ageRanges];
    this.filteredLists.preferredFoot = [...this.preferredFootOptions];
    this.filteredLists.transferStatus = [...this.transferStatusOptions];
  }

  // Filter functions for each dropdown
  filterOptions(type: 'position' | 'region' | 'age' | 'foot' | 'status', searchTerm: string) {
    const term = searchTerm.toLowerCase();

    switch(type) {
      case 'position':
        this.filteredLists.positions = this.positions.filter(pos =>
          pos.toLowerCase().includes(term));
        break;
      case 'region':
        this.filteredLists.regions = this.regions.filter(reg =>
          reg.toLowerCase().includes(term));
        break;
      case 'age':
        this.filteredLists.ageRanges = this.ageRanges.filter(age =>
          age.label.toLowerCase().includes(term));
        break;
      case 'foot':
        this.filteredLists.preferredFoot = this.preferredFootOptions.filter(foot =>
          foot.label.toLowerCase().includes(term));
        break;
      case 'status':
        this.filteredLists.transferStatus = this.transferStatusOptions.filter(status =>
          status.label.toLowerCase().includes(term));
        break;
    }
  }

  // Event handler for select focus
  onSelectFocus(type: 'position' | 'region' | 'age' | 'foot' | 'status') {
    // Reset the filtered list when the select is focused
    this.searchTerms[type] = '';
    this.filterOptions(type, '');
  }

  // Event handler for select keydown
  onSelectKeydown(event: KeyboardEvent, type: 'position' | 'region' | 'age' | 'foot' | 'status') {
    const key = event.key.toLowerCase();
    if (key.length === 1 && /[a-z0-9]/.test(key)) {
      this.searchTerms[type] += key;
      this.filterOptions(type, this.searchTerms[type]);
    } else if (key === 'backspace') {
      this.searchTerms[type] = this.searchTerms[type].slice(0, -1);
      this.filterOptions(type, this.searchTerms[type]);
    }
  }

  toggleAccountMenu(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.showAccountMenu = !this.showAccountMenu;

    // Keep sidebar expanded when menu is open
    if (this.showAccountMenu) {
      this.sidebarExpanded = true;
      // Add click outside listener when menu is opened
      setTimeout(() => {
        document.addEventListener('click', this.handleClickOutside);
      });
    }
  }

  handleClickOutside = (event: Event) => {
    const accountMenu = document.querySelector('.account-menu');
    if (accountMenu && !accountMenu.contains(event.target as Node)) {
      this.showAccountMenu = false;
      document.removeEventListener('click', this.handleClickOutside);
      // Allow sidebar to collapse after menu is closed
      if (!this.showSearchPanel) {
        this.sidebarExpanded = false;
      }
    }
  }

  async logout() {
    await this.authService.logout();
  }

  toggleRightPanel() {
    this.showRightPanel = !this.showRightPanel;
  }

  closeRightPanel() {
    this.showRightPanel = false;
  }
}
