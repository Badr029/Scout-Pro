import { Component, OnInit, OnDestroy, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpEventType } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { SharedModule } from '../shared/shared.module';
import { NotificationPanelComponent } from '../shared/components/notification-panel/notification-panel.component';
import { FeedService } from '../services/feed.service';
import { ReportModalComponent } from '../shared/components/report-modal/report-modal.component';

const API_URL = environment.apiUrl;

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

interface VideoPost {
  id: number;
  title: string;
  description: string;
  file_path: string | null;
  thumbnail: string | null;
  user: UserInfo;
  likes_count: number;
  comments_count: number;
  views: number;
  has_liked: boolean;
  likes: any[];
  comments: any[];
  created_at: string;
}

interface UserInfo {
  id: number;
  player_id?: number;
  first_name: string;
  last_name: string;
  profile_image: string | null;
  full_name: string;
  user_type: string;
  player: any;
  isCurrentUser: boolean;
  following: boolean;
  is_following?: boolean;
}

interface PremiumPlayer {
  user_id: number;
  following: boolean;
  is_following?: boolean;
  [key: string]: any;
}

interface TrendingPlayer {
  id: number;
  following: boolean;
  is_following?: boolean;
  [key: string]: any;
}

interface EventItem {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  image: string | null;
  status: 'pending' | 'approved' | 'rejected';
  is_organizer: boolean;
  target_audience: string;
}

@Component({
  selector: 'app-home-feed',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    SharedModule,
    NotificationPanelComponent,
    ReportModalComponent
  ],
  templateUrl: './home-feed.component.html',
  styleUrl: './home-feed.component.css'
})
export class HomeFeedComponent implements OnInit, OnDestroy {
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
  premiumPlayers: any[] = [];
  private followStatusSubscription: Subscription;
  showNotificationPanel: boolean = false;
  reportType: 'video' | 'user' | 'bug' = 'video';
  reportItemId: number | null = null;

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

  // Event form properties
  showEventForm = false;
  eventForm: FormGroup;
  isSubmittingEvent = false;
  selectedEventImage: File | null = null;
  eventImagePreview: string | null = null;
  locationLink: string = '';

  // Report modal
  showReportModal = false;

  @ViewChild('reportModalRef') reportModalRef: ReportModalComponent | null = null;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private http: HttpClient,
    private authService: AuthService,
    private fb: FormBuilder,
    private feedService: FeedService
  ) {
    console.log('HomeFeedComponent constructor');
    const userType = localStorage.getItem('user_type');
    console.log('User type from localStorage:', userType);
    this._isInitialScout = this.authService.getUserType() === 'scout';
    this.checkMobileView();
    window.addEventListener('resize', () => this.checkMobileView());
    this.followStatusSubscription = this.apiService.followStatusChanged$.subscribe(
      (data) => {
        if (data) {
          this.updateFollowStateInFeed(data.userId, data.following);
        }
      }
    );

    // Initialize event form
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      date: ['', Validators.required],
      time: ['', Validators.required],
      location: ['', Validators.required],
      description: [''],
      image: [''],
      organizer_contact: ['', [Validators.required, Validators.email]],
      target_audience: ['players', Validators.required]
    });

    // Listen to location changes to update Google Maps link
    this.eventForm.get('location')?.valueChanges.subscribe(location => {
      if (location) {
        this.locationLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
      } else {
        this.locationLink = '';
      }
    });
  }

  ngOnInit() {
    console.log('HomeFeedComponent ngOnInit');
    // Load persisted follow states
    this.loadPersistedFollowStates();

    // Get user data first
    this.getUserProfile();
    // Then load other data
    this.loadFeedData();
    this.loadPremiumPlayers();
    this.loadRecentSearches();
    this.initializeFilteredLists();
    this.setupEventListeners();

    // Check follow status for all users in the feed
    this.checkAllUsersFollowStatus();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', () => this.checkMobileView());
    if (this.followStatusSubscription) {
      this.followStatusSubscription.unsubscribe();
    }
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
              profile_image: response.data.profile_image || null,
              user_type: userType,
              scout_id: response.data.scout_id || response.data.id,
              role: response.data.role || 'scout'
            };
          } else {
            // Handle player profile data structure
            this.currentUser = {
              id: response.data.user_id || response.data.id,
              name: `${response.data.first_name} ${response.data.last_name}`,
              profile_image: response.data.profile_image || null,
              user_type: userType,
              player_id: response.data.player_id || response.data.id,
              role: response.data.role
            };
          }

          // Process profile image URL if it exists
          if (this.currentUser.profile_image) {
            this.currentUser.profile_image = this.getProfileImageUrl(this.currentUser.profile_image);
          }

          console.log('Current user data after setup:', this.currentUser);
        }
      },
      error: (error) => {
        console.error('Error getting user profile:', error);
        if (error.status === 401) {
          localStorage.clear();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  loadFeedData() {
    this.loading = true;
    this.error = '';

    // Get the current follow states from localStorage
    const followedUsers = JSON.parse(localStorage.getItem('followedUsers') || '{}');

    // Get both feed and events data
    Promise.all([
      this.apiService.getData('feed').toPromise(),
      this.apiService.getData('events').toPromise()
    ]).then(([feedResponse, eventsResponse]) => {
      console.log('Feed response:', feedResponse);

      if (feedResponse?.status === 'success') {
        // Process posts to include user data
        const processedPosts = (feedResponse.posts?.data || []).map((post: any) => {
          console.log('Processing post user data:', post.user);

          // Process user data for each post
          const processedUser = {
            id: post.user?.id,
            user_type: post.user?.user_type,
            first_name: post.user?.first_name,
            last_name: post.user?.last_name,
            username: post.user?.username,
            profile_image: this.getProfileImageUrl(post.user?.profile_image),
            membership: post.user?.membership || 'free',
            isCurrentUser: post.user?.id === this.currentUser?.id,
            // Use both API response and localStorage for follow state
            following: post.user?.following || post.user?.is_following || followedUsers[post.user?.id] || false,
            is_following: post.user?.following || post.user?.is_following || followedUsers[post.user?.id] || false,
            player: post.user?.player ? {
              position: post.user.player.position || 'No Position',
              region: post.user.player.current_city || 'No Region',
              nationality: post.user.player.nationality
            } : null
          };

          // Process comments to include user data
          const processedComments = (post.comments || []).map((comment: any) => {
            console.log('Processing comment user data:', comment.user);
            const commentUser = comment.user;
            let profileImage = null;

            // Get profile image based on user type
            if (commentUser?.user_type === 'scout' && commentUser?.scout) {
              profileImage = commentUser.scout.profile_image;
            } else if (commentUser?.user_type === 'player' && commentUser?.player) {
              profileImage = commentUser.player.profile_image;
            }

            return {
              ...comment,
              user: {
                id: commentUser?.id,
                first_name: commentUser?.first_name,
                last_name: commentUser?.last_name,
                full_name: `${commentUser?.first_name} ${commentUser?.last_name}`.trim(),
                profile_image: this.getProfileImageUrl(profileImage),
                user_type: commentUser?.user_type,
                scout_id: commentUser?.scout?.id,
                player_id: commentUser?.player?.id,
                isCurrentUser: commentUser?.id === this.currentUser?.id,
                player: commentUser?.player ? {
                  position: commentUser.player.position || 'No Position',
                  region: commentUser.player.current_city || 'No Region',
                  nationality: commentUser.player.nationality
                } : null
              }
            };
          });

          console.log('Processed user data:', processedUser);
          console.log('Processed comments:', processedComments);

          // Return processed post with updated user data and comments
          return {
            ...post,
            user: processedUser,
            comments: processedComments
          };
        });

        console.log('Processed posts:', processedPosts);

        this.feedData = {
          ...feedResponse,
          posts: {
            ...feedResponse.posts,
            data: processedPosts
          },
          upcoming_events: [] // We'll set this from events response
        };

        // Load premium players for scouts
        if (this.isScout) {
          this.loadPremiumPlayers();
        }
      }

      if (eventsResponse?.status === 'success') {
        // Filter events based on status and organizer
        const events = (eventsResponse.data || []).filter((event: EventItem) => {
          // Show approved events to everyone
          if (event.status === 'approved') return true;

          // Show pending events only to their organizers
          if (event.status === 'pending' && event.is_organizer) return true;

          // Don't show rejected events
          return false;
        });

        // Update events in feedData
        this.feedData.upcoming_events = events;
      }

      this.loading = false;
    }).catch(error => {
      console.error('Error loading data:', error);
      this.error = 'Failed to load feed data';
      this.loading = false;
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

    // Direct storage URL for profile images
    return `http://localhost:8000/storage/${profileImage.replace(/^\/*/, '')}`;
  }

  goToProfile() {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.currentUser.user_type === 'scout') {
      this.router.navigate(['/scout/profile']);
    } else {
      this.router.navigate(['/profile']);
    }
  }

  goToUserProfile(userId: number) {
    if (!userId) return;

    if (userId === this.currentUser?.id) {
      this.goToProfile();
    } else {
      // Get user type from the feed data
      const user = this.findUserInFeed(userId);
      if (user?.user_type === 'scout') {
        // Call scout profile API and navigate
        this.apiService.getData(`scout/${userId}`).subscribe({
          next: (response: any) => {
            if (response.data) {
              this.router.navigate(['/scout', userId]);
            } else {
              this.showNotification('Failed to load scout profile');
            }
          },
          error: (error: any) => {
            console.error('Error loading scout profile:', error);
            this.showNotification('Failed to load scout profile');
          }
        });
      } else {
        // Handle player profile navigation
        this.apiService.getData(`player/${userId}`).subscribe({
          next: (response: any) => {
            if (response.data) {
              this.router.navigate(['/player', userId]);
            } else {
              this.showNotification('Failed to load player profile');
            }
          },
          error: (error: any) => {
            console.error('Error loading player profile:', error);
            this.showNotification('Failed to load player profile');
          }
        });
      }
    }
  }

  goToPlayerProfile(userId: number) {
    if (!userId) return;

    if (userId === this.currentUser?.id) {
      this.goToProfile();
    } else {
      this.router.navigate(['/player', userId]);
    }
  }

  goToScoutProfile(userId: number) {
    if (!userId) return;

    if (userId === this.currentUser?.id) {
      this.router.navigate(['/scout/profile']);
    } else {
      this.router.navigate(['/scout', userId]);
    }
  }

  // Helper method to find a user in the feed data
  private findUserInFeed(userId: number): any {
    // Check in posts
    for (const post of this.feedData.posts.data) {
      if (post.user.id === userId) {
        return post.user;
      }
      // Check in comments
      if (post.comments) {
        const comment = post.comments.find((c: any) => c.user.id === userId);
        if (comment) {
          return comment.user;
        }
      }
    }

    // Check in premium players
    const premiumPlayer = this.premiumPlayers.find((player: PremiumPlayer) => player.user_id === userId);
    if (premiumPlayer) {
      return premiumPlayer;
    }

    // Check in trending players
    const trendingPlayer = this.feedData?.trending_players?.find((player: TrendingPlayer) => player.id === userId);
    if (trendingPlayer) {
      return trendingPlayer;
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

  followPlayer(userId: number) {
    if (!userId) return;

    const user = this.findUserInFeed(userId);
    if (!user) return;

    // Determine if we're following or unfollowing
    const isCurrentlyFollowing = user.following || user.is_following;

    // Optimistically update UI
    this.updateFollowStateInFeed(userId, !isCurrentlyFollowing);

    // Make API call
    const apiCall = isCurrentlyFollowing ?
      this.apiService.unfollowPlayer(userId) :
      this.apiService.followPlayer(userId);

    apiCall.subscribe({
      next: (response: any) => {
        if (response.status !== 'success') {
          // Revert the optimistic update on error
          this.updateFollowStateInFeed(userId, isCurrentlyFollowing);
          this.showNotification('Failed to update follow status');
        }
      },
      error: (error: any) => {
        console.error('Error toggling follow status:', error);
        // Revert the optimistic update on error
        this.updateFollowStateInFeed(userId, isCurrentlyFollowing);
        this.showNotification('Failed to update follow status');
      }
    });
  }

  private updateFollowStateInFeed(userId: number, following: boolean) {
    // Update in feed posts
    if (this.feedData?.posts?.data) {
      this.feedData.posts.data = this.feedData.posts.data.map((post: any) => {
        if (post.user?.id === userId) {
          return {
            ...post,
            user: {
              ...post.user,
              following: following,
              is_following: following
            }
          };
        }
        return post;
      });
    }

    // Update in premium players
    if (this.premiumPlayers) {
      this.premiumPlayers = this.premiumPlayers.map((player: any) => {
        if (player.user_id === userId) {
          return {
            ...player,
            following: following,
            is_following: following
          };
        }
        return player;
      });
    }

    // Update in trending players
    if (this.feedData?.trending_players) {
      this.feedData.trending_players = this.feedData.trending_players.map((player: any) => {
        if (player.id === userId) {
          return {
            ...player,
            following: following,
            is_following: following
          };
        }
        return player;
      });
    }

    // Force change detection
    this.feedData = { ...this.feedData };
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
            // Get profile image based on user type
            let profileImage = null;
            if (this.currentUser.user_type === 'scout' && this.currentUser.scout) {
              profileImage = this.currentUser.scout.profile_image;
            } else if (this.currentUser.user_type === 'player' && this.currentUser.player) {
              profileImage = this.currentUser.player.profile_image;
            }

            // Create new comment object with proper structure
            const newComment = {
              id: response.data.id,
              content: response.data.content,
              created_at: response.data.created_at,
              user_id: response.data.user_id,
              user: {
                id: this.currentUser.id,
                first_name: this.currentUser.name.split(' ')[0],
                last_name: this.currentUser.name.split(' ')[1],
                full_name: this.currentUser.name,
                profile_image: this.getProfileImageUrl(profileImage),
                user_type: this.currentUser.user_type,
                scout_id: this.currentUser.scout_id,
                player_id: this.currentUser.player_id,
                isCurrentUser: true,
                player: this.currentUser.player
              }
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

    // Check if user has reached upload limit
    if (this.userProfile?.membership === 'free' && this.userProfile?.monthly_video_count >= 2) {
      this.uploadError = 'You have reached your monthly upload limit. Please upgrade to Premium for unlimited uploads.';
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
              // Update the user profile to get new video count
              this.getUserProfile();
          this.closeUploadModal();
              // Reload feed to show new video
              this.loadFeedData();
          this.showNotification('Video uploaded successfully');
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

  openUploadModal() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    // Check if user is a player
    if (!this.isPlayer) {
      this.showNotification('Only players can upload videos');
      return;
    }

    // Check upload limits for free users
    if (this.userProfile?.membership === 'free' && this.userProfile?.monthly_video_count >= 2) {
      this.showNotification('You have reached your monthly upload limit. Please upgrade to Premium for unlimited uploads.');
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

  goToEvent(event: EventItem) {
    // Open Google Maps with the event location
    const encodedLocation = encodeURIComponent(event.location);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
    window.open(mapsUrl, '_blank');
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

  showLikesList(postId: number, event: MouseEvent) {
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
            post.views = response.data.views;
            // Add to viewed videos set
            this.viewedVideos.add(postId);
          }
        }
      },
      error: (error: any) => {
        console.error('Error recording video view:', error);
      }
    });
  }

  onVideoPlay(event: Event, postId?: number) {
    if (postId) {
      this.incrementVideoViews(postId);
    }
  }

  get isPlayer(): boolean {
    return this.currentUser?.user_type === 'player';
  }

  get isScout(): boolean {
    return this.currentUser?.user_type === 'scout';
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

    // Prepare search filters based on user type
    const userType = this.currentUser?.user_type || localStorage.getItem('user_type');
    let searchFilters = {};

    if (this.isScout) {
      // Only include non-empty filter values
      const filters: any = {
        age_range: this.filters.age_range,
        preferred_foot: this.filters.preferred_foot,
        region: this.filters.region,
        position: this.filters.position,
        transfer_status: this.filters.transfer_status
      };

      // Remove undefined or empty string values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined || filters[key] === '') {
          delete filters[key];
        }
      });

      searchFilters = filters;
    }

    const searchData = {
      search_query: this.searchQuery.trim(),
      filters: searchFilters,
      user_type: userType
    };

    console.log('Search request data:', searchData);

    this.apiService.postData('search', searchData).subscribe({
      next: (response: any) => {
        console.log('Search response:', response);
        this.loading = false;

        if (response.data) {
          // Handle the results array from the response
          const results = response.data.results || [];
          console.log('Raw search results:', results);

          // Process each result to ensure proper image URLs and data structure
          this.searchResults = results.map((result: any) => {
            console.log('Processing result:', result);

            // Base result object with common properties
            const processedResult = {
              ...result,
              profile_image: result.profile_image ? this.getProfileImageUrl(result.profile_image) : null,
              first_name: result.first_name || '',
              last_name: result.last_name || '',
              full_name: `${result.first_name || ''} ${result.last_name || ''}`.trim(),
              type: result.type || 'player',
              id: result.id,
              user_id: result.user_id,
              scout_id: result.scout_id
            };

            // Add type-specific properties
            if (result.type === 'scout') {
              return {
                ...processedResult,
                organization: result.organization || '',
                position_title: result.position_title || '',
                city: result.city || '',
                country: result.country || ''
              };
            } else {
              return {
                ...processedResult,
                position: result.position || '',
                nationality: result.nationality || '',
                current_city: result.current_city || '',
                membership: result.membership || 'free'
              };
            }
          });

          console.log('Processed search results:', this.searchResults);
        }
      },
      error: (error: any) => {
        console.error('Search error:', error);
        this.loading = false;
        this.error = 'Failed to perform search';
      }
    });
  }

  toggleSearchPanel() {
    this.showSearchPanel = !this.showSearchPanel;
    if (this.showSearchPanel) {
      this.loadRecentSearches();
    }
  }

  showNotification(message: string, type: 'success' | 'error' = 'success') {
    this.notification = message;
    setTimeout(() => {
      this.notification = '';
    }, 3000);
  }

  getAvatarUrl(name?: string): string {
    if (!name) return 'assets/default-avatar.png';
    const [firstName, lastName] = name.split(' ');
    return `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`;
  }

  handleImageError(event: ErrorEvent, name?: string): void {
    if (!name) {
      (event.target as HTMLImageElement).src = 'assets/default-avatar.png';
      return;
    }
    const [firstName, lastName] = name.split(' ');
    (event.target as HTMLImageElement).src = this.getAvatarUrl(name);
  }

  toggleCommentBox(postId: number) {
    this.showCommentBox[postId] = !this.showCommentBox[postId];
  }

  deleteComment(postId: number, commentId: number) {
    if (confirm('Are you sure you want to delete this comment?')) {
      this.http.delete(`${API_URL}/videos/${postId}/comments/${commentId}`, {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        })
      }).subscribe({
        next: (response: any) => {
          if (response.status === 'success') {
            // Update the post's comments in the feed
            const post = this.feedData.posts.data.find((p: any) => p.id === postId);
            if (post) {
              post.comments = post.comments.filter((c: any) => c.id !== commentId);
              post.comments_count = post.comments.length;
            }
            // Show success notification
            this.notification = 'Comment deleted successfully';
            setTimeout(() => this.notification = '', 3000);
          }
        },
        error: (error) => {
          console.error('Error deleting comment:', error);
          this.error = error.error?.message || 'Failed to delete comment';
          setTimeout(() => this.error = '', 3000);
        }
      });
    }
  }

  expandSidebar() {
    this.sidebarExpanded = true;
  }

  collapseSidebar() {
    // Don't collapse if any panel is open
    if (!this.showSearchPanel && !this.showAccountMenu && !this.showNotificationPanel) {
      this.sidebarExpanded = false;
    }
  }

  switchView(view: 'feed' | 'events') {
    this.activeView = view;
    // No need to reload events when switching to events tab
    // as we already have them loaded
  }

  scrollToFeedContent() {
    // Switch to feed view if not already there
    this.activeView = 'feed';

    // Close any open panels
    this.showSearchPanel = false;
    this.showFeedFilter = false;
    this.showAccountMenu = false;
    this.showNotificationPanel = false;
    this.showRightPanel = false;

    // Allow sidebar to collapse
    this.sidebarExpanded = false;

    // Scroll to feed content
    setTimeout(() => {
      const feedContainer = document.querySelector('.reels-container');
      if (feedContainer) {
        feedContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // If feed container not found, scroll to feed container
        const mainFeedContainer = document.querySelector('.feed-container');
        if (mainFeedContainer) {
          mainFeedContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);
  }

  // Add method to get event status class
  getEventStatusClass(event: EventItem): string {
    if (event.status === 'pending' && event.is_organizer) {
      return 'event-pending';
    }
    return '';
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
    // Remove api from the API_URL since videos are served from the base URL
    const baseUrl = API_URL.replace('/api', '');
    return `${baseUrl}/storage/${filePath.replace(/^\/+/, '')}`;
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

    // Map frontend filter names to backend filter names
    interface MappedFilters {
      [key: string]: string | undefined;
    }

    const mappedFilters: MappedFilters = {
      player_position: filters.position,
      preferred_foot: filters.preferred_foot?.toLowerCase(),
      region: filters.region,
      playing_style: filters.playing_style?.toLowerCase(),
      transfer_status: filters.transfer_status,
      age_range: filters.age_range
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

            // Age filter using the age_range
            if (mappedFilters['age_range']) {
              // Convert negative decimal age to positive integer
              const playerAge = Math.abs(Math.round(player.age));
              if (isNaN(playerAge)) {
                console.log('Invalid player age:', player.age);
                return false;
              }

              const [minAge, maxAge] = mappedFilters['age_range'].split('-').map(Number);
              console.log('Age check - Player Age:', playerAge, 'Range:', minAge, '-', maxAge);

              // Special handling for "29-35" which includes all players 29 and above
              if (minAge === 29) {
                if (playerAge < 29) {
                  console.log('Age below minimum for 29+ category:', playerAge);
                return false;
                }
              } else {
                // Normal range check for other age ranges
                if (playerAge < minAge || playerAge > maxAge) {
                  console.log('Age not in range:', playerAge, 'not between', minAge, 'and', maxAge);
                  return false;
                }
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
            file_path: video.file_path,
            thumbnail: video.thumbnail,
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

  toggleAccountMenu(event: MouseEvent): void {
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

  handleClickOutside = (event: MouseEvent): void => {
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

  goToSubscription() {
    this.router.navigate(['/subscription']);
  }

  loadPremiumPlayers() {
    this.apiService.getData('premium-players').subscribe({
      next: (response: any) => {
        if (response.status === 'success' && response.data) {
          this.premiumPlayers = response.data.map((player: any) => ({
            ...player,
            profile_image: player.image ? player.image : null,
            name: player.name || 'Unknown Player'
          }));
        }
      },
      error: (error) => {
        console.error('Error loading premium players:', error);
      }
    });
  }

  toggleEventForm() {
    this.showEventForm = !this.showEventForm;
    if (!this.showEventForm) {
      this.eventForm.reset({
        target_audience: 'players'
      });
      this.selectedEventImage = null;
      this.eventImagePreview = null;
    }
  }

  onEventImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedEventImage = file;

      // Create image preview
      const reader = new FileReader();
      reader.onload = () => {
        this.eventImagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async onSubmitEvent() {
    if (this.eventForm.valid) {
      this.isSubmittingEvent = true;

      try {
        // Create form data
        const formData = new FormData();
        const formValue = this.eventForm.value;

        // Combine date and time
        const dateTime = new Date(formValue.date);
        const time = formValue.time.split(':');
        dateTime.setHours(parseInt(time[0]), parseInt(time[1]));

        // Append all form fields except date which we'll handle separately
        Object.keys(formValue).forEach(key => {
          if (key !== 'date') {
            formData.append(key, formValue[key]);
          }
        });

        // Append the date and time separately
        formData.append('date', formValue.date);
        formData.append('time', formValue.time);

        // Append image if selected
        if (this.selectedEventImage) {
          // Validate file size
          if (this.selectedEventImage.size > environment.maxUploadSize) {
            throw new Error('Image size exceeds the maximum allowed size (5MB)');
          }

          // Validate file type
          if (!environment.supportedImageTypes.includes(this.selectedEventImage.type)) {
            throw new Error('Unsupported image type. Please use JPG or PNG.');
          }

          formData.append('image', this.selectedEventImage);
        }

        // Send request using ApiService
        await this.apiService.postData('events', formData).toPromise();

        // Reset form
        this.eventForm.reset({
          target_audience: 'players'
        });
        this.selectedEventImage = null;
        this.eventImagePreview = null;
        this.showEventForm = false;

        // Show success message
        this.notification = 'Event request submitted successfully! It will be reviewed by administrators.';
        setTimeout(() => {
          this.notification = '';
        }, 5000);

        // Reload events
        this.loadFeedData();
      } catch (error: any) {
        console.error('Error submitting event:', error);
        this.error = error.error?.message || error.message || 'Error submitting event request. Please try again.';
        setTimeout(() => {
          this.error = '';
        }, 5000);
      } finally {
        this.isSubmittingEvent = false;
      }
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.eventForm.controls).forEach(key => {
        const control = this.eventForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  // Update the event click handler in the template to pass the entire event object
  getEventDateTime(date: string): string {
    const eventDate = new Date(date);
    return eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  hasPendingEvents(): boolean {
    return this.feedData?.upcoming_events?.some((event: EventItem) => event.status === 'pending' && event.is_organizer) || false;
  }

  getPendingEvents(): EventItem[] {
    return this.feedData?.upcoming_events?.filter((event: EventItem) => event.status === 'pending' && event.is_organizer) || [];
  }

  getApprovedEvents(): EventItem[] {
    return this.feedData?.upcoming_events?.filter((event: EventItem) => event.status === 'approved') || [];
  }

  private loadPersistedFollowStates() {
    const followedUsers = JSON.parse(localStorage.getItem('followedUsers') || '{}');

    // Update follow states in feed data if it exists
    if (this.feedData?.posts?.data) {
      this.feedData.posts.data = this.feedData.posts.data.map((post: any) => {
        if (post.user && followedUsers[post.user.id]) {
          return {
            ...post,
            user: {
              ...post.user,
              following: true,
              is_following: true
            }
          };
        }
        return post;
      });
    }

    // Update follow states in premium players
    if (this.premiumPlayers) {
      this.premiumPlayers = this.premiumPlayers.map((player: any) => {
        if (followedUsers[player.user_id]) {
          return {
            ...player,
            following: true,
            is_following: true
          };
        }
        return player;
      });
    }

    // Update follow states in trending players
    if (this.feedData?.trending_players) {
      this.feedData.trending_players = this.feedData.trending_players.map((player: any) => {
        if (followedUsers[player.id]) {
          return {
            ...player,
            following: true,
            is_following: true
          };
        }
        return player;
      });
    }
  }

  setupEventListeners() {
    // Implementation of setupEventListeners method
  }

  private checkAllUsersFollowStatus() {
    if (!this.feedData?.posts?.data) return;

    // Get unique user IDs from posts
    const userIds = new Set<number>();
    this.feedData.posts.data.forEach((post: any) => {
      if (post.user && post.user.id !== this.currentUser?.id) {
        userIds.add(post.user.id);
      }
    });

    // Check follow status for each user
    userIds.forEach(userId => {
      this.apiService.checkFollowStatus(userId).subscribe();
    });
  }

  handleNotificationPanelToggle(isOpen: boolean) {
    this.showNotificationPanel = isOpen;
    // Keep sidebar expanded when notification panel is open
    if (isOpen) {
      this.sidebarExpanded = true;
    } else {
      // Only collapse if no other panels are open
      this.collapseSidebar();
    }
  }

  // Report modal
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
    console.log('Submitting report:', { type: this.reportType, itemId: this.reportItemId, formData });

    this.feedService.submitReport({
      type: this.reportType,
      item_id: this.reportItemId!,
      reason: formData.reason,
      description: formData.description,
      browser_info: this.reportType === 'bug' ? formData.browser_info : undefined
    }).subscribe({
      next: (response) => {
        console.log('Report submitted successfully:', response);
        this.reportModalRef?.showMessage('Report submitted successfully', 'success');
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

        this.reportModalRef?.showMessage(errorMessage, 'error');
      }
    });
  }
}
