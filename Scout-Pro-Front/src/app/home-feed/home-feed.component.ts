import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

const API_URL = 'http://localhost:8000';

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

  constructor(
    private router: Router,
    private apiService: ApiService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.getUserProfile();
    this.loadFeedData();
  }

  getUserProfile() {
    this.apiService.getUserProfile().subscribe({
      next: (response: any) => {
        if (response.data) {
          this.userProfile = response.data;
          this.currentUser = {
            id: response.data.user_id,
            name: `${response.data.first_name} ${response.data.last_name}`,
            profile_image: response.data.profile_image
              ? `${API_URL}/storage/${response.data.profile_image}`
              : null,
            user_type: response.data.user_type,
            player_id: response.data.id,
            role: response.data.role
          };
          console.log('Current user data:', this.currentUser);
          console.log('User profile data:', this.userProfile);
        }
      },
      error: (error: any) => {
        console.error('Error fetching user profile:', error);
        if (error.status === 401) {
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

            // Check if the video's user ID matches the current user's ID
            const isCurrentUser = video.user.id === this.currentUser?.id;

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
                isCurrentUser: isCurrentUser
              },
              likes_count: video.likes_count || 0,
              comments_count: video.comments?.length || 0,
              views: video.views || 0,
              has_liked: video.has_liked || false,
              likes: (video.likes || []).map((like: any) => ({
                id: like.id,
                user: {
                  id: like.user.id,
                  player_id: like.user.player?.id,
                  first_name: like.user.first_name,
                  last_name: like.user.last_name,
                  profile_image: like.user.profile_image,
                  full_name: `${like.user.first_name} ${like.user.last_name}`.trim(),
                  player: like.user.player,
                  isCurrentUser: like.user.id === this.currentUser?.id
                }
              })),
              comments: (video.comments || []).map((comment: any) => ({
                id: comment.id,
                content: comment.content,
                created_at: comment.created_at,
                user_id: comment.user_id,
                user: {
                  id: comment.user.id,
                  player_id: comment.user.player?.id,
                  first_name: comment.user.first_name,
                  last_name: comment.user.last_name,
                  profile_image: comment.user.profile_image ? `${API_URL}/storage/${comment.user.profile_image}` : null,
                  full_name: `${comment.user.first_name} ${comment.user.last_name}`.trim(),
                  isCurrentUser: comment.user.id === this.currentUser?.id
                }
              })),
              created_at: video.created_at
            };
          });

          console.log('Processed videos:', processedVideos);

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

    // Navigate based on user type
    if (this.currentUser.user_type === 'scout') {
      this.router.navigate(['/scout-profile']);
    } else {
      this.router.navigate(['/profile']);
    }
  }

  goToUserProfile(userId: number) {
    if (!userId) return;

    if (userId === this.currentUser?.id) {
      // If it's the current user, go to their profile based on user type
      if (this.currentUser.user_type === 'scout') {
        this.router.navigate(['/scout-profile']);
      } else {
        this.router.navigate(['/profile']);
      }
    } else {
      // If it's another user, only allow viewing player profiles
      this.router.navigate(['/player-view', userId]);
    }
  }

  goToPlayerProfile(playerId: number) {
    if (!playerId) return;

    if (playerId === this.currentUser?.id) {
      // If it's the current user, go to their profile based on user type
      if (this.currentUser.user_type === 'scout') {
        this.router.navigate(['/scout-profile']);
      } else {
        this.router.navigate(['/profile']);
      }
    } else {
      // If it's another player, go to their view profile page
      this.router.navigate(['/player-view', playerId]);
    }
  }

  followPlayer(playerId: number) {
    if (!playerId || playerId === this.currentUser?.id) return;

    this.apiService.postData(`players/${playerId}/follow`, {}).subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          // Update UI to show following status
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
          this.showNotification('Successfully followed player');
        }
      },
      error: (error: any) => {
        console.error('Error following player:', error);
        this.showNotification('Failed to follow player');
      }
    });
  }

  unfollowPlayer(playerId: number) {
    if (!playerId || playerId === this.currentUser?.id) return;

    this.apiService.postData(`players/${playerId}/unfollow`, {}).subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          // Update UI to show unfollowed status
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
          this.showNotification('Successfully unfollowed player');
        }
      },
      error: (error: any) => {
        console.error('Error unfollowing player:', error);
        this.showNotification('Failed to unfollow player');
      }
    });
  }

  likePost(postId: number) {
    if (!postId) return;

    const post = this.feedData.posts.data.find((p: any) => p.id === postId);
    if (!post) return;

    // We'll only use the like endpoint now, as it handles both like and unlike
    this.apiService.postData(`videos/${postId}/like`, {}).subscribe({
      next: (response: any) => {
        console.log('Like response:', response); // Debug log
        if (response.status === 'success') {
          // Update the post's like status
          post.has_liked = response.data.has_liked;
          post.likes_count = response.data.likes_count;

          // Update likes array
          if (response.data.has_liked && response.data.like) {
            if (!post.likes) post.likes = [];
            // Remove any existing like by this user
            post.likes = post.likes.filter((like: any) => like.user.id !== this.currentUser.id);
            // Add the new like
            post.likes.unshift(response.data.like);
          } else {
            // Remove this user's like
            if (post.likes) {
              post.likes = post.likes.filter((like: any) => like.user.id !== this.currentUser.id);
            }
          }

          console.log('Updated post:', post); // Debug log
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
    this.searchQuery = term;
    this.onSearch();
  }

  clearSearch() {
    this.searchQuery = '';
    this.onSearch();
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
    if (post && post.likes) {
      this.selectedPostLikes = post.likes;
      this.showLikesModal = true;
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

  get isPlayer() {
    return this.currentUser?.user_type === 'player';
  }

  get isScout() {
    return this.currentUser?.user_type === 'scout';
  }

  // Add proper types for these methods
  onFilterChange(key: string, value: string) {
    this.filters[key] = value;
    this.loadFeedData();
  }

  toggleFilter() {
    this.showFilters = !this.showFilters;
  }

  onSearch() {
    this.loadFeedData();
    this.showSearchPanel = false;
  }

  toggleSearchPanel() {
    this.showSearchPanel = !this.showSearchPanel;
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
    if (!this.showSearchPanel) {
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
}
