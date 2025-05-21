import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-home-feed',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home-feed.component.html',
  styleUrl: './home-feed.component.css'
})
export class HomeFeedComponent implements OnInit {
  feedData: any = null;
  filters: any = {
    location: 'UK, London',
    position: '',
    secondary_position: '',
    region: '',
    age: '',
    height: '',
    preferred_foot: '',
    playing_style: '',
    transfer_status: ''
  };
  loading = false;
  error = '';
  notification = '';
  currentYear = new Date().getFullYear();
  searchQuery: string = '';
  showFilters = false;
  showSearchPanel = false;
  activeView = 'reels'; // 'reels', 'grid', 'events'
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

  constructor(private router: Router, private apiService: ApiService) {}

  ngOnInit() {
    this.getUserProfile();
    this.loadFeedData();
  }

  getUserProfile() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.apiService.getUserProfile().subscribe(
      (data: any) => {
        this.userProfile = data;
      },
      (error: any) => {
        console.error('Error fetching user profile', error);
      }
    );
  }

  loadFeedData(): void {
    this.loading = true;
    this.apiService.getData('feed').subscribe(
      (data: any) => {
        this.feedData = data;
        this.loading = false;
      },
      (error: any) => {
        console.error('Error fetching feed data', error);
        this.loading = false;
        this.error = 'Failed to load feed data';
      }
    );
  }

  fetchFeed() {
    this.loading = true;
    this.error = '';
    // FAKE DATA for UI preview
    setTimeout(() => {
      let allPosts = [
        {
          id: 1,
          title: 'Amazing Goal! ⚽',
          description: 'Watch this stunning goal from last weekend.',
          video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12',
          player: {
            id: 101,
            name: 'John Doe',
            position: 'Forward',
            region: 'Europe',
            following: false,
            profile_image: 'https://ui-avatars.com/api/?name=John+Doe'
          },
          views: 1200,
          likes: 150,
          comments: [
            { user: 'scout123', text: 'Incredible skill!', timestamp: '2h ago' },
            { user: 'coach_dave', text: 'Great control and finish', timestamp: '1h ago' }
          ],
          liked: false,
          created_at: '2023-06-15T14:30:00Z'
        },
        {
          id: 2,
          title: 'Defensive Skills',
          description: 'Top tackles and interceptions.',
          video_url: 'https://www.w3schools.com/html/movie.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68',
          player: {
            id: 102,
            name: 'Jane Smith',
            position: 'Defender',
            region: 'Africa',
            following: true,
            profile_image: 'https://ui-avatars.com/api/?name=Jane+Smith'
          },
          views: 800,
          likes: 90,
          comments: [
            { user: 'football_fan', text: 'Solid defending', timestamp: '5h ago' }
          ],
          liked: true,
          created_at: '2023-06-10T09:15:00Z'
        },
        {
          id: 3,
          title: 'Speed Training',
          description: 'Working on my acceleration and sprint technique.',
          video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974',
          player: {
            id: 103,
            name: 'Mike Johnson',
            position: 'Midfielder',
            region: 'North America',
            following: false,
            profile_image: 'https://ui-avatars.com/api/?name=Mike+Johnson'
          },
          views: 450,
          likes: 62,
          comments: [],
          liked: false,
          created_at: '2023-06-05T16:20:00Z'
        }
      ];

      // Filter by searchQuery and filters
      let filteredPosts = allPosts.filter(post => {
        const matchesSearch = this.searchQuery.trim() === '' ||
          post.player.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          post.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          post.description.toLowerCase().includes(this.searchQuery.toLowerCase());

        const matchesPosition = !this.filters.position ||
          post.player.position.toLowerCase() === this.filters.position.toLowerCase();

        const matchesRegion = !this.filters.region ||
          post.player.region.toLowerCase() === this.filters.region.toLowerCase();

        // Age filter is mock (not in data)
        return matchesSearch && matchesPosition && matchesRegion;
      });

      this.feedData = {
        user_type: 'scout', // Change to 'player' to preview player UI
        filter_options: [
          { label: 'Position', key: 'position', options: [
            { label: 'All', value: '' }, { label: 'Forward', value: 'forward' }, { label: 'Midfielder', value: 'midfielder' }, { label: 'Defender', value: 'defender' }, { label: 'Goalkeeper', value: 'goalkeeper' }
          ]},
          { label: 'Region', key: 'region', options: [
            { label: 'All', value: '' }, { label: 'Europe', value: 'europe' }, { label: 'Africa', value: 'africa' }, { label: 'Asia', value: 'asia' }, { label: 'America', value: 'america' }
          ]},
          { label: 'Age', key: 'age', options: [
            { label: 'All', value: '' }, { label: 'Under 16', value: 'u16' }, { label: '16-18', value: '16-18' }, { label: '19-21', value: '19-21' }, { label: '22+', value: '22+' }
          ]},
          { label: 'Height', key: 'height', options: [
            { label: 'All', value: '' }, { label: 'Under 170cm', value: '<170' }, { label: '170-180cm', value: '170-180' }, { label: '180-190cm', value: '180-190' }, { label: '190cm+', value: '190+' }
          ]},
          { label: 'Weight', key: 'weight', options: [
            { label: 'All', value: '' }, { label: 'Under 65kg', value: '<65' }, { label: '65-75kg', value: '65-75' }, { label: '75-85kg', value: '75-85' }, { label: '85kg+', value: '85+' }
          ]},
          { label: 'Preferred Foot', key: 'preferred_foot', options: [
            { label: 'All', value: '' }, { label: 'Right', value: 'right' }, { label: 'Left', value: 'left' }, { label: 'Both', value: 'both' }
          ]},
          { label: 'Playing Style', key: 'playing_style', options: [
            { label: 'All', value: '' }, { label: 'Attacker', value: 'attacker' }, { label: 'Playmaker', value: 'playmaker' }, { label: 'Defender', value: 'defender' }, { label: 'Box-to-Box', value: 'box-to-box' }
          ]},
          { label: 'Transfer Status', key: 'transfer_status', options: [
            { label: 'All', value: '' }, { label: 'Available', value: 'available' }, { label: 'Not Available', value: 'not_available' }
          ]}
        ],
        posts: {
          data: filteredPosts,
          current_page: 1,
          last_page: 1
        },
        trending_players: [
          { id: 201, name: 'John Doe', position: 'Forward', region: 'Europe', image: 'https://ui-avatars.com/api/?name=John+Doe' },
          { id: 202, name: 'Jane Smith', position: 'Defender', region: 'Africa', image: 'https://ui-avatars.com/api/?name=Jane+Smith' },
          { id: 203, name: 'Alex Brown', position: 'Midfielder', region: 'Asia', image: 'https://ui-avatars.com/api/?name=Alex+Brown' }
        ],
        upcoming_events: [
          {
            id: 301,
            title: 'Summer Cup',
            date: '2024-07-15',
            desc: 'The biggest youth football event of the summer. Join top talents and scouts from around the world!',
            image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
            location: 'London, UK'
          },
          {
            id: 302,
            title: 'Scouting Combine',
            date: '2024-08-01',
            desc: 'Showcase your skills in front of professional scouts. Registration open now!',
            image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80',
            location: 'Manchester, UK'
          }
        ],
        recommendations: [
          { id: 401, name: 'Michael Green', position: 'Forward', region: 'Europe', image: 'https://ui-avatars.com/api/?name=Michael+Green' },
          { id: 402, name: 'Emily White', position: 'Midfielder', region: 'North America', image: 'https://ui-avatars.com/api/?name=Emily+White' }
        ],
        suggested_searches: [
          'Forward', 'Under 18', 'London', 'Available for transfer'
        ]
      };
      this.loading = false;
    }, 700);
  }

  onFilterChange(key: string, value: string) {
    this.filters[key] = value;
    this.fetchFeed();
  }

  toggleFilter() {
    this.showFilters = !this.showFilters;
  }

  likePost(postId: number) {
    // Fake like logic
    const post = this.feedData.posts.data.find((p: any) => p.id === postId);
    if (post) {
      post.liked = !post.liked;
      post.likes += post.liked ? 1 : -1;
      this.showNotification(post.liked ? 'You liked a post!' : 'You unliked a post!');
    }
  }

  followPlayer(playerId: number) {
    // Fake follow logic
    this.feedData.posts.data.forEach((post: any) => {
      if (post.player.id === playerId) {
        post.player.following = !post.player.following;
      }
    });
    this.showNotification('You toggled follow for a player!');
  }

  showNotification(message: string) {
    this.notification = message;
    setTimeout(() => this.notification = '', 2000);
  }

  get isPlayer() {
    return this.feedData?.user_type === 'player';
  }

  get isScout() {
    return this.feedData?.user_type === 'scout';
  }

  loadMore() {
    // No pagination in mock
    this.showNotification('No more posts in demo mode.');
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  goToPlayerProfile(playerId: number) {
    this.router.navigate(['/player', playerId]);
  }

  onSearch() {
    this.fetchFeed();
    this.showSearchPanel = false;
  }

  toggleSearchPanel() {
    this.showSearchPanel = !this.showSearchPanel;
  }

  switchView(view: string) {
    this.activeView = view;
  }

  toggleCommentBox(postId: number) {
    this.showCommentBox[postId] = !this.showCommentBox[postId];
  }

  postComment(postId: number) {
    if (!this.newComment.trim()) return;

    const post = this.feedData.posts.data.find((p: any) => p.id === postId);
    if (post) {
      post.comments.push({
        user: this.userProfile?.username || 'currentuser',
        text: this.newComment,
        timestamp: 'Just now'
      });
      post.comments_count = post.comments.length;
      this.newComment = '';
      this.showCommentBox[postId] = false;
      this.showNotification('Comment posted!');
    }
  }

  openUploadModal() {
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

    this.uploadProgress = 10;

    // Simulating upload progress
    const interval = setInterval(() => {
      this.uploadProgress += 20;
      if (this.uploadProgress >= 100) {
        clearInterval(interval);

        // Simulate successful upload
        setTimeout(() => {
          this.loadFeedData();
          this.closeUploadModal();
          this.showNotification('Video uploaded successfully!');
        }, 500);
      }
    }, 500);
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
}
