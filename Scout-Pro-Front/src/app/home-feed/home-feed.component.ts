import { Component, OnInit } from '@angular/core';
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
    playing_style: ''
  };
  loading = false;
  error = '';
  notification = '';
  currentYear = new Date().getFullYear();
  searchQuery: string = '';
  showFilters = false;
  showSearchPanel = false;

  constructor(private router: Router, private apiService: ApiService) {}

  ngOnInit() {
    this.loadFeedData();
  }

  loadFeedData(): void {
    this.apiService.getData('feed-endpoint').subscribe(
      (data: any) => {
        this.feedData = data;
      },
      (error: any) => {
        console.error('Error fetching feed data', error);
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
          player: { id: 101, name: 'John Doe', position: 'Forward', region: 'Europe', following: false },
          views: 1200,
          likes: 150,
          comments: 12,
          liked: false
        },
        {
          id: 2,
          title: 'Defensive Skills',
          description: 'Top tackles and interceptions.',
          video_url: 'https://www.w3schools.com/html/movie.mp4',
          player: { id: 102, name: 'Jane Smith', position: 'Defender', region: 'Africa', following: true },
          views: 800,
          likes: 90,
          comments: 5,
          liked: true
        }
      ];
      // Filter by searchQuery and filters
      let filteredPosts = allPosts.filter(post => {
        const matchesSearch = this.searchQuery.trim() === '' ||
          post.player.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          post.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          post.description.toLowerCase().includes(this.searchQuery.toLowerCase());
        const matchesPosition = !this.filters.position || post.player.position === this.filters.position;
        const matchesRegion = !this.filters.region || post.player.region === this.filters.region;
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
          { name: 'John Doe' },
          { name: 'Jane Smith' },
          { name: 'Alex Brown' }
        ],
        upcoming_events: [
          {
            title: 'Summer Cup',
            date: '2024-07-15',
            desc: 'The biggest youth football event of the summer. Join top talents and scouts from around the world!',
            image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80'
          },
          {
            title: 'Scouting Combine',
            date: '2024-08-01',
            desc: 'Showcase your skills in front of professional scouts. Registration open now!',
            image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80'
          }
        ],
        recommendations: [
          { name: 'Michael Green' },
          { name: 'Emily White' }
        ]
      };
      this.loading = false;
    }, 700);
  }

  onFilterChange(key: string, value: string) {
    this.filters[key] = value;
    this.fetchFeed();
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
  }

  toggleSearchPanel() {
    this.showSearchPanel = !this.showSearchPanel;
  }
}
