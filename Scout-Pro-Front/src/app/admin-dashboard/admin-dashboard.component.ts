import { Component, OnInit, OnDestroy, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Chart } from 'chart.js/auto';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ModalService } from '../services/modal.service';
import { ModalComponent } from '../components/modal/modal.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface ContactRequest {
  id: number;
  scout: {
    id: number;
    name: string;
    email: string;
    profile?: {
      company: string;
      position: string;
      region: string;
      profile_image: string | null;
    };
  };
  player: {
    id: number;
    name: string;
    email: string;
    profile?: {
      position: string;
      nationality: string;
      current_city: string;
      profile_image: string | null;
    };
  };
  status: 'pending' | 'approved' | 'rejected';
  message: string | null;
  created_at: string;
  responded_at: string | null;
}

interface EventRequest {
  id: number;
  title: string;
  description: string | null;
  date: string;
  location: string;
  image: string | null;
  organizer_contact: string;
  target_audience: 'players' | 'scouts' | 'public';
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  responded_at: string | null;
  created_at: string;
  organizer: {
    id: number;
    name: string;
    email: string;
    profile?: {
      company: string;
      region: string;
      profile_image: string | null;
    };
  };
}

interface Plan {
  id: number;
  Name: string;
  Duration: number;
  Price: number;
}

interface Subscription {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    type: string;
  };
  plan: string;
  status: string;
  expires_at: string;
  created_at: string;
  payment?: {
    amount: number;
    card_last_four: string;
    created_at: string;
  };
}

interface Payment {
  id: number;
  amount: number;
  card_last_four: string;
  cardholder_name: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
  invoices: {
    id: number;
    issue_date: string;
    status: string;
  }[];
}

interface MonthlyTransaction {
  month: string;
  count: number;
  revenue: number;
}

interface PaymentStats {
  totalRevenue: number;
  monthlyRevenue: number;
  averageTransaction: number;
  totalTransactions: number;
  revenueGrowth: number;
  monthlyGrowth: number;
  monthlyTransactions: any[];
}

interface RenewalInfo {
  date: Date;
  count: number;
}

interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  upcomingRenewals: number;
  nextRenewals: Array<{
    user: string;
    expires_at: string;
  }>;
  retentionRate: number;
  newSubscriptions: number;
  churnedSubscriptions: number;
}

interface VideoStats {
  id: number;
  title: string;
  views: number;
  likes: number;
  comments_count: number;
  status: string;
  thumbnail: string;
  duration: string;
  created_at: string;
  user: {
    name: string;
    email: string;
  };
}

interface VideoDetails extends Omit<VideoStats, 'comments_count' | 'user'> {
  description: string;
  file_path: string;
  comments: VideoComment[];
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface VideoComment {
  id: number;
  content: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ModalComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  Math = Math;

  stats = {
    totalUsers: 0,
    totalPlayers: 0,
    totalScouts: 0,
    totalVideos: 0,
    totalLikes: 0,
    totalComments: 0,
    totalFollows: 0
  };

  currentSection: 'statistics' | 'contact-requests' | 'event-requests' | 'subscriptions' | 'user-management' | 'content-management' = 'statistics';
  activeView: 'overview' | 'contact-requests' | 'event-requests' | 'subscriptions' = 'overview';
  contactRequests: ContactRequest[] = [];
  eventRequests: EventRequest[] = [];
  loadingRequests = false;
  loadingEvents = false;
  requestError: string | null = null;
  eventError: string | null = null;
  successMessage: string | null = null;
  eventSuccessMessage: string | null = null;

  userGrowthChart: Chart | null = null;
  engagementChart: Chart | null = null;
  videoStatsChart: Chart | null = null;
  revenueChart: Chart | null = null;
  loading = true;
  error: string | null = null;

  // Subscription Management Properties
  plans: Plan[] = [];
  subscriptions: Subscription[] = [];
  payments: Payment[] = [];
  loadingSubscription = {
    plans: false,
    subscriptions: false,
    payments: false
  };
  subscriptionError = {
    plans: '',
    subscriptions: '',
    payments: ''
  };
  editingPlan: Plan | null = null;
  selectedSubscription: Subscription | null = null;

  // Add these properties
  users: any[] = [];
  userSearchQuery: string = '';
  userTypeFilter: string = '';
  selectedUser: any = null;

  // Event Form Properties
  eventForm: FormGroup;
  showEventForm = false;
  isSubmittingEvent = false;
  selectedEventImage: File | null = null;
  eventImagePreview: string | null = null;

  // New properties
  paymentStats: PaymentStats = {
    totalRevenue: 0,
    monthlyRevenue: 0,
    averageTransaction: 0,
    totalTransactions: 0,
    revenueGrowth: 0,
    monthlyGrowth: 0,
    monthlyTransactions: []
  };

  subscriptionStats: SubscriptionStats = {
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    upcomingRenewals: 0,
    nextRenewals: [],
    retentionRate: 0,
    newSubscriptions: 0,
    churnedSubscriptions: 0
  };

  // Add to the existing properties
  selectedScoutDocuments: any = null;

  // Add new properties
  videos: VideoStats[] = [];
  loadingVideos = false;
  videoError: string | null = null;
  videoSortField: 'views' | 'likes' = 'views';
  videoSortOrder: 'asc' | 'desc' = 'desc';
  selectedVideo: VideoDetails | null = null;
  loadingVideoDetails = false;
  videoDetailsError: string | null = null;

  private readonly API_URL = environment.apiUrl;

  isMobile = window.innerWidth <= 768;
  isMenuOpen = !this.isMobile;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    public modalService: ModalService,
    private viewContainerRef: ViewContainerRef,
    private fb: FormBuilder
  ) {
    this.modalService.setContainer(this.viewContainerRef);
    window.addEventListener('resize', this.onResize.bind(this));

    // Initialize Event Form
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      date: ['', Validators.required],
      time: ['', Validators.required],
      location: ['', Validators.required],
      description: [''],
      organizer_contact: ['', [Validators.required, Validators.email]],
      target_audience: ['public', Validators.required]
    });
  }

  ngOnInit() {
    console.log('=== COMPONENT INITIALIZATION ===');
    console.log('1. Starting component initialization');

    // Initialize default values
    console.log('2. Initial payment stats:', this.paymentStats);
    console.log('3. Initial subscription stats:', this.subscriptionStats);

    // Load payment and subscription stats first
    this.loadPaymentStats();
    this.loadSubscriptionStats();

    // Load other stats
    this.loadStats();
    this.loadCharts();
    this.loadContactRequests();
    this.loadEventRequests();
    this.loadPlans();
    this.loadSubscriptions();
    this.loadPayments();
    this.loadUsers();
  }

  ngOnDestroy() {
    // Cleanup charts to prevent memory leaks
    [this.userGrowthChart, this.engagementChart, this.videoStatsChart].forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
    window.removeEventListener('resize', this.onResize.bind(this));
  }

  setSection(section: 'statistics' | 'contact-requests' | 'event-requests' | 'subscriptions' | 'user-management' | 'content-management') {
    this.currentSection = section;
    if (section === 'content-management') {
      this.loadVideos();
    } else if (section === 'user-management') {
      this.loadUsers();
    } else if (section === 'contact-requests') {
      this.loadContactRequests();
    } else if (section === 'event-requests') {
      this.loadEventRequests();
    } else if (section === 'subscriptions') {
      this.loadPlans();
      this.loadSubscriptions();
      this.loadPayments();
    }
    if (this.isMobile) {
      this.isMenuOpen = false;
    }
  }

  switchView(view: 'overview' | 'contact-requests' | 'event-requests' | 'subscriptions') {
    this.activeView = view;
    if (view === 'overview') {
      this.currentSection = 'statistics';
    } else if (view === 'contact-requests' || view === 'event-requests') {
      this.currentSection = view;
    }
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
  }

  loadStats() {
    this.loading = true;
    this.error = null;

    this.http.get<any>(`${this.API_URL}/admin/stats`, { headers: this.getHeaders() })
      .subscribe({
        next: (data) => {
          this.stats = data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading stats:', error);
          this.error = 'Failed to load statistics. Please try again later.';
          this.loading = false;
        }
      });
  }

  loadCharts() {
    // User Growth Chart
    this.http.get<any>(`${this.API_URL}/admin/user-growth`, { headers: this.getHeaders() })
      .subscribe({
        next: (data) => {
          this.createUserGrowthChart(data);
        },
        error: (error) => {
          console.error('Error loading user growth data:', error);
        }
      });

    // Engagement Chart
    this.http.get<any>(`${this.API_URL}/admin/engagement`, { headers: this.getHeaders() })
      .subscribe({
        next: (data) => {
          this.createEngagementChart(data);
        },
        error: (error) => {
          console.error('Error loading engagement data:', error);
        }
      });

    // Video Stats Chart
    this.http.get<any>(`${this.API_URL}/admin/video-stats`, { headers: this.getHeaders() })
      .subscribe({
        next: (data) => {
          this.createVideoStatsChart(data);
        },
        error: (error) => {
          console.error('Error loading video stats:', error);
        }
      });
  }

  private createUserGrowthChart(data: any) {
    const ctx = document.getElementById('userGrowthChart') as HTMLCanvasElement;
    if (this.userGrowthChart) {
      this.userGrowthChart.destroy();
    }

    if (ctx) {
      this.userGrowthChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [
            {
              label: 'New Users',
              data: data.values,
              borderColor: '#1DB954',
              backgroundColor: 'rgba(29, 185, 84, 0.1)',
              tension: 0.1,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'User Growth Over Time',
              color: '#ffffff'
            },
            legend: {
              labels: {
                color: '#ffffff'
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: '#333'
              },
              ticks: {
                color: '#B3B3B3'
              }
            },
            x: {
              grid: {
                color: '#333'
              },
              ticks: {
                color: '#B3B3B3'
              }
            }
          }
        }
      });
    }
  }

  private createEngagementChart(data: any) {
    const ctx = document.getElementById('engagementChart') as HTMLCanvasElement;
    if (this.engagementChart) {
      this.engagementChart.destroy();
    }

    if (ctx) {
      this.engagementChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Likes', 'Comments', 'Follows'],
          datasets: [
            {
              label: 'Engagement Metrics',
              data: [data.likes, data.comments, data.follows],
              backgroundColor: [
                'rgba(29, 185, 84, 0.8)',
                'rgba(255, 107, 107, 0.8)',
                'rgba(64, 153, 255, 0.8)'
              ]
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Platform Engagement',
              color: '#ffffff'
            },
            legend: {
              labels: {
                color: '#ffffff'
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: '#333'
              },
              ticks: {
                color: '#B3B3B3'
              }
            },
            x: {
              grid: {
                color: '#333'
              },
              ticks: {
                color: '#B3B3B3'
              }
            }
          }
        }
      });
    }
  }

  private createVideoStatsChart(data: any) {
    const ctx = document.getElementById('videoStatsChart') as HTMLCanvasElement;
    if (this.videoStatsChart) {
      this.videoStatsChart.destroy();
    }

    if (ctx) {
      this.videoStatsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Active', 'Processing'],
          datasets: [
            {
              data: [data.active, data.processing],
              backgroundColor: [
                'rgba(29, 185, 84, 0.8)',
                'rgba(255, 107, 107, 0.8)'
              ]
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Video Status Distribution',
              color: '#ffffff'
            },
            legend: {
              labels: {
                color: '#ffffff'
              }
            }
          }
        }
      });
    }
  }

  loadContactRequests() {
    this.loadingRequests = true;
    this.requestError = null;
    this.successMessage = null;

    this.http.get<{status: string; data: ContactRequest[]}>(`${this.API_URL}/admin/contact-requests`, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          this.contactRequests = response.data;
          this.loadingRequests = false;
        },
        error: (error) => {
          console.error('Error loading contact requests:', error);
          this.requestError = 'Failed to load contact requests. Please try again later.';
          this.loadingRequests = false;
        }
      });
  }

  updateRequest(requestId: number, status: 'approved' | 'rejected') {
    const action = status === 'approved' ? 'approve' : 'reject';
    if (confirm(`Are you sure you want to ${action} this contact request?`)) {
      this.http.put<{status: string; message: string; details?: any}>(
        `${this.API_URL}/admin/contact-requests/${requestId}`,
        { status },
        { headers: this.getHeaders() }
      ).subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.loadContactRequests();
          // Auto-hide success message after 3 seconds
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: (error) => {
          console.error('Error updating contact request:', error);
          this.requestError = error.error?.message || 'Failed to update contact request. Please try again.';
          if (error.error?.details) {
            console.error('Error details:', error.error.details);
          }
        }
      });
    }
  }

  loadEventRequests() {
    this.loadingEvents = true;
    this.eventError = null;

    this.http.get<any>(`${this.API_URL}/admin/event-requests`, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          this.eventRequests = response.data;
          this.loadingEvents = false;
        },
        error: (error) => {
          console.error('Error loading event requests:', error);
          this.eventError = 'Failed to load event requests. Please try again.';
          this.loadingEvents = false;
        }
      });
  }

  updateEventStatus(eventId: number, status: 'approved' | 'rejected', rejectionReason?: string) {
    const data = {
      status,
      rejection_reason: rejectionReason
    };

    if (status === 'rejected' && !rejectionReason) {
      const reason = prompt('Please provide a reason for rejection:');
      if (!reason) return; // Cancel if no reason provided
      data.rejection_reason = reason;
    }

    this.http.put<{status: string; message: string; data: any}>(`${this.API_URL}/admin/event-requests/${eventId}`, data, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          // Update the event in the list
          this.eventRequests = this.eventRequests.map(event =>
            event.id === eventId ? { ...event, ...response.data } : event
          );

          this.eventSuccessMessage = response.message;
          setTimeout(() => {
            this.eventSuccessMessage = null;
          }, 3000);

          // Refresh the list to ensure we have the latest data
          this.loadEventRequests();
        },
        error: (error) => {
          console.error('Error updating event request:', error);
          this.eventError = error.error?.message || 'Failed to update event request. Please try again.';
          if (error.error?.details) {
            console.error('Error details:', error.error.details);
          }
          setTimeout(() => {
            this.eventError = null;
          }, 3000);
        }
      });
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Subscription Management Methods
  loadPlans() {
    this.loadingSubscription.plans = true;
    this.subscriptionError.plans = '';

    this.http.get<any>(`${this.API_URL}/admin/subscription-plans`, { headers: this.getHeaders() }).subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          this.plans = response.data;
        }
        this.loadingSubscription.plans = false;
      },
      error: (error) => {
        console.error('Error loading plans:', error);
        this.subscriptionError.plans = 'Failed to load subscription plans';
        this.loadingSubscription.plans = false;
      }
    });
  }

  loadSubscriptions() {
    this.loadingSubscription.subscriptions = true;
    this.subscriptionError.subscriptions = '';

    this.http.get<any>(`${this.API_URL}/admin/user-subscriptions`, { headers: this.getHeaders() }).subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          console.log('Subscription response:', response.data);
          this.subscriptions = response.data.map((sub: any) => {
            console.log('Individual subscription:', sub);
            return {
              ...sub,
              plan: sub.plan || { Name: 'N/A', Price: 0, Duration: 0 }  // Provide default values if plan is missing
            };
          });
        }
        this.loadingSubscription.subscriptions = false;
      },
      error: (error) => {
        console.error('Error loading subscriptions:', error);
        this.subscriptionError.subscriptions = 'Failed to load user subscriptions';
        this.loadingSubscription.subscriptions = false;
      }
    });
  }

  loadPayments() {
    this.loadingSubscription.payments = true;
    this.subscriptionError.payments = '';

    this.http.get<any>(`${this.API_URL}/admin/payment-history`, { headers: this.getHeaders() }).subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          this.payments = response.data;
        }
        this.loadingSubscription.payments = false;
      },
      error: (error) => {
        console.error('Error loading payments:', error);
        this.subscriptionError.payments = 'Failed to load payment history';
        this.loadingSubscription.payments = false;
      }
    });
  }

  startEditingPlan(plan: Plan) {
    this.editingPlan = { ...plan };
  }

  cancelEditingPlan() {
    this.editingPlan = null;
  }

  savePlan() {
    if (!this.editingPlan) return;

    this.loadingSubscription.plans = true;
    this.subscriptionError.plans = '';

    this.http.put<any>(`${this.API_URL}/admin/subscription-plans/${this.editingPlan.id}`, this.editingPlan, { headers: this.getHeaders() }).subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          this.loadPlans();
          this.editingPlan = null;
        }
        this.loadingSubscription.plans = false;
      },
      error: (error) => {
        console.error('Error updating plan:', error);
        this.subscriptionError.plans = 'Failed to update subscription plan';
        this.loadingSubscription.plans = false;
      }
    });
  }

  updateUserSubscription(userId: number, planId: number) {
    this.loadingSubscription.subscriptions = true;
    this.subscriptionError.subscriptions = '';

    this.http.put<any>(`${this.API_URL}/admin/user-subscriptions/${userId}`, { plan_id: planId }, { headers: this.getHeaders() }).subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          this.loadSubscriptions();
        }
        this.loadingSubscription.subscriptions = false;
      },
      error: (error) => {
        console.error('Error updating subscription:', error);
        this.subscriptionError.subscriptions = 'Failed to update user subscription';
        this.loadingSubscription.subscriptions = false;
      }
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  }

  getDurationText(days: number): string {
    if (days >= 365) {
      const years = Math.floor(days / 365);
      return `${years} year${years > 1 ? 's' : ''}`;
    } else if (days >= 30) {
      const months = Math.floor(days / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    }
    return `${days} day${days > 1 ? 's' : ''}`;
  }

  deactivateSubscription(userId: number, userType: string) {
    this.loadingSubscription.subscriptions = true;
    this.subscriptionError.subscriptions = '';

    const payload = {
      user_id: userId,
      status: false,
      user_type: userType
    };

    this.http.put<any>(`${this.API_URL}/admin/user-subscriptions/${userId}/deactivate`, payload, { headers: this.getHeaders() })
      .subscribe({
        next: (response: any) => {
          if (response.status === 'success') {
            this.loadSubscriptions(); // Reload the subscriptions list
          }
          this.loadingSubscription.subscriptions = false;
        },
        error: (error) => {
          console.error('Error deactivating subscription:', error);
          this.subscriptionError.subscriptions = 'Failed to deactivate subscription';
          this.loadingSubscription.subscriptions = false;
        }
      });
  }

  // Add these methods
  loadUsers() {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    const params = new HttpParams()
      .set('search', this.userSearchQuery)
      .set('type', this.userTypeFilter);

    this.loading = true;
    this.error = null;

    this.http.get<any>(`${this.API_URL}/admin/users`, { headers, params }).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.users = response.data;
        } else {
          this.error = 'Failed to load users';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.error = error.error?.message || 'Failed to load users. Please try again.';
        this.loading = false;
      }
    });
  }

  searchUsers() {
    this.loadUsers(); // Reuse the loadUsers method with current search parameters
  }

  viewUserDetails(user: any) {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    this.loading = true;
    this.error = null;

    this.http.get<any>(`${this.API_URL}/admin/users/${user.id}`, { headers }).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.selectedUser = response.data;
          this.modalService.open('userDetailsModal'); // Make sure this ID matches your modal
        } else {
          this.error = 'Failed to load user details';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading user details:', error);
        this.error = error.error?.message || 'Failed to load user details. Please try again.';
        this.loading = false;
      }
    });
  }

  closeUserDetails() {
    this.selectedUser = null;
    this.modalService.close();
  }

  deleteUser(user: any) {
    if (confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}'s account? This action cannot be undone and will delete all associated data including videos, comments, and profile information.`)) {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      });

      this.loading = true;
      this.error = null;

      this.http.delete<any>(`${this.API_URL}/admin/users/${user.id}`, { headers }).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            // Remove user from the list
            this.users = this.users.filter(u => u.id !== user.id);

            // Close modal if the deleted user was being viewed
            if (this.selectedUser?.id === user.id) {
              this.closeUserDetails();
            }

            // Show success message
            this.successMessage = 'User deleted successfully';
            setTimeout(() => {
              this.successMessage = null;
            }, 3000);
          } else {
            this.error = 'Failed to delete user';
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.error = error.error?.message || 'Failed to delete user. Please try again.';
          this.loading = false;
          setTimeout(() => {
            this.error = null;
          }, 3000);
        }
      });
    }
  }

  private onResize() {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.isMenuOpen = true;
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleEventForm() {
    this.showEventForm = !this.showEventForm;
    if (!this.showEventForm) {
      this.eventForm.reset({
        target_audience: 'public'
      });
      this.removeEventImage();
    }
  }

  onEventImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should not exceed 5MB');
        return;
      }

      this.selectedEventImage = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.eventImagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeEventImage() {
    this.selectedEventImage = null;
    this.eventImagePreview = null;
    const fileInput = document.getElementById('image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  async onSubmitEvent() {
    if (this.eventForm.invalid) return;

    this.isSubmittingEvent = true;
    const formData = new FormData();

    // Add form fields to FormData
    Object.keys(this.eventForm.value).forEach(key => {
      if (this.eventForm.value[key]) {
        formData.append(key, this.eventForm.value[key]);
      }
    });

    // Add image if selected
    if (this.selectedEventImage) {
      formData.append('image', this.selectedEventImage);
    }

    // Add status as approved since this is admin creation
    formData.append('status', 'approved');

    try {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      });

      const response = await this.http.post(
        `${this.API_URL}/admin/events/create`,
        formData,
        { headers }
      ).toPromise();

      if (response) {
        this.toggleEventForm();
        this.loadEventRequests(); // Refresh the events list
        this.eventSuccessMessage = 'Event created successfully!';
        setTimeout(() => {
          this.eventSuccessMessage = null;
        }, 3000);
      }
    } catch (error: any) {
      console.error('Error creating event:', error);
      this.eventError = error.error?.message || 'Failed to create event. Please try again.';
      setTimeout(() => {
        this.eventError = null;
      }, 3000);
    } finally {
      this.isSubmittingEvent = false;
    }
  }

  private loadPaymentStats(): void {
    console.log('Loading payment stats...');
    this.loading = true;  // Set loading to true when starting
    this.error = null;    // Clear any previous errors

    this.http.get<any>(`${this.API_URL}/admin/payment-stats`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.paymentStats = response.data;
          console.log('Payment stats loaded:', this.paymentStats);
          console.log('Monthly transactions:', this.paymentStats.monthlyTransactions);
          this.loading = false;  // Set loading to false before creating chart
          // Create revenue chart with the monthly transactions data
          setTimeout(() => {  // Add small delay to ensure DOM is updated
            this.createRevenueChart(this.paymentStats.monthlyTransactions);
          }, 0);
        } else {
          console.error('Error in payment stats response:', response);
          this.error = 'Failed to load payment statistics';
          this.setDefaultPaymentStats();
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error in loadPaymentStats:', error);
        this.error = 'Failed to load payment statistics. Please try again later.';
        console.log('Setting default values due to error');
        this.setDefaultPaymentStats();
        console.log('Default payment stats set:', this.paymentStats);
        this.loading = false;
      }
    });
  }

  private createRevenueChart(monthlyData: MonthlyTransaction[]): void {
    console.log('Creating revenue chart with data:', monthlyData);
    console.log('Current section:', this.currentSection);
    console.log('Loading state:', this.loading);
    console.log('Error state:', this.error);

    const ctx = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (!ctx) {
      console.error('Could not find revenue chart canvas element');
      console.error('DOM state - currentSection:', this.currentSection);
      console.error('DOM state - loading:', this.loading);
      console.error('DOM state - error:', this.error);
      return;
    }

    if (this.revenueChart) {
      console.log('Destroying existing chart');
      this.revenueChart.destroy();
    }

    // Ensure we have data for the last 12 months
    const now = new Date();
    const labels = Array.from({length: 12}, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return d.toLocaleString('default', { year: 'numeric', month: 'short' });
    });

    // Create a map of existing data
    const dataMap = new Map(
      monthlyData.map(item => {
        const date = new Date(item.month);
        const formattedMonth = date.toLocaleString('default', { year: 'numeric', month: 'short' });
        return [formattedMonth, item.revenue];
      })
    );

    // Fill in missing months with 0
    const currentMonthData = labels.map(month => {
      const value = dataMap.get(month) || 0;
      return value;
    });

    // Create the chart with simpler configuration first
    this.revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Monthly Revenue',
          data: currentMonthData,
          borderColor: '#4a6cf7',
          backgroundColor: 'rgba(74, 108, 247, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: {
              color: '#ffffff'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#333'
            },
            ticks: {
              color: '#B3B3B3',
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          },
          x: {
            grid: {
              color: '#333'
            },
            ticks: {
              color: '#B3B3B3'
            }
          }
        }
      }
    });

    console.log('Chart created:', this.revenueChart);
  }

  private loadSubscriptionStats(): void {
    this.http.get<any>(`${this.API_URL}/admin/subscription-stats`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.subscriptionStats = response.data;
          console.log('5. Subscription stats loaded');
        } else {
          console.error('6. Error in subscription stats response:', response);
          this.setDefaultSubscriptionStats();
        }
      },
      error: (error) => {
        console.error('9. Error in loadSubscriptionStats:', error);
        console.log('10. Setting default values due to error');
        this.setDefaultSubscriptionStats();
        console.log('11. Default subscription stats set:', this.subscriptionStats);
      }
    });
  }

  private setDefaultPaymentStats(): void {
    this.paymentStats = {
      totalRevenue: 0,
      monthlyRevenue: 0,
      averageTransaction: 0,
      totalTransactions: 0,
      revenueGrowth: 0,
      monthlyGrowth: 0,
      monthlyTransactions: []
    };
  }

  private setDefaultSubscriptionStats(): void {
    this.subscriptionStats = {
      totalSubscriptions: 0,
      activeSubscriptions: 0,
      expiredSubscriptions: 0,
      upcomingRenewals: 0,
      nextRenewals: [],
      retentionRate: 0,
      newSubscriptions: 0,
      churnedSubscriptions: 0
    };
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  // Add these methods
  viewScoutDocuments(user: any) {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    this.loading = true;
    this.error = null;

    this.http.get<any>(`${this.API_URL}/admin/scout-documents/${user.id}`, { headers })
      .subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.selectedScoutDocuments = response.data;
            // Open the modal after data is loaded
            this.modalService.open('scoutDocumentsModal');
          } else {
            this.error = 'Failed to load scout documents';
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading scout documents:', error);
          this.error = error.error?.message || 'Failed to load scout documents. Please try again.';
          this.loading = false;
        }
      });
  }

  closeScoutDocuments() {
    this.selectedScoutDocuments = null;
    this.modalService.close();
  }

  getDocumentUrl(path: string): string {
    return path.startsWith('http') ? path : `${this.API_URL}/storage/${path}`;
  }

  // Add new methods for content management
  loadVideos() {
    this.loadingVideos = true;
    this.videoError = null;

    this.http.get<any>(`${this.API_URL}/admin/videos`, {
      headers: this.getHeaders(),
      params: {
        sort_by: this.videoSortField,
        order: this.videoSortOrder,
        include_comments: 'true'  // Request to include comments data
      }
    }).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          // Map the response data to ensure comments_count is present
          this.videos = response.data.map((video: any) => {
            // Calculate comments count from either the array or the count field
            const commentsCount = video.comments?.length ?? video.comments_count ?? 0;
            return {
              ...video,
              comments_count: commentsCount
            };
          });
        } else {
          this.videoError = 'Failed to load videos';
        }
        this.loadingVideos = false;
      },
      error: (error) => {
        console.error('Error loading videos:', error);
        this.videoError = error.error?.message || 'Failed to load videos. Please try again.';
        this.loadingVideos = false;
      }
    });
  }

  removeVideo(videoId: number) {
    if (confirm('Are you sure you want to remove this video? This action cannot be undone.')) {
      this.http.delete<any>(`${this.API_URL}/admin/videos/${videoId}`, {
        headers: this.getHeaders()
      }).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.videos = this.videos.filter(v => v.id !== videoId);
            if (this.selectedVideo?.id === videoId) {
              this.closeVideoDetails();
            }
            this.successMessage = 'Video removed successfully';
            setTimeout(() => {
              this.successMessage = null;
            }, 3000);
          }
        },
        error: (error) => {
          console.error('Error removing video:', error);
          this.error = error.error?.message || 'Failed to remove video. Please try again.';
          setTimeout(() => {
            this.error = null;
          }, 3000);
        }
      });
    }
  }

  sortVideos(field: 'views' | 'likes') {
    this.videoSortField = field;
    this.videoSortOrder = this.videoSortOrder === 'asc' ? 'desc' : 'asc';
    this.loadVideos();
  }

  // Add new methods
  viewVideoDetails(videoId: number) {
    this.loadingVideoDetails = true;
    this.videoDetailsError = null;
    this.selectedVideo = null; // Reset selected video before loading

    this.http.get<any>(`${this.API_URL}/admin/videos/${videoId}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.selectedVideo = response.data;
          this.loadingVideoDetails = false; // Set loading to false before opening modal
          this.modalService.open('videoDetailsModal');
        } else {
          this.videoDetailsError = 'Failed to load video details';
          this.loadingVideoDetails = false;
        }
      },
      error: (error) => {
        console.error('Error loading video details:', error);
        this.videoDetailsError = error.error?.message || 'Failed to load video details. Please try again.';
        this.loadingVideoDetails = false;
      }
    });
  }

  closeVideoDetails() {
    this.selectedVideo = null;
    this.modalService.close();
  }

  deleteComment(videoId: number, commentId: number) {
    if (confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      this.http.delete<any>(`${this.API_URL}/admin/videos/${videoId}/comments/${commentId}`, {
        headers: this.getHeaders()
      }).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            if (this.selectedVideo) {
              this.selectedVideo.comments = this.selectedVideo.comments.filter(c => c.id !== commentId);
            }
            this.successMessage = 'Comment deleted successfully';
            setTimeout(() => {
              this.successMessage = null;
            }, 3000);
          }
        },
        error: (error) => {
          console.error('Error deleting comment:', error);
          this.error = error.error?.message || 'Failed to delete comment. Please try again.';
          setTimeout(() => {
            this.error = null;
          }, 3000);
        }
      });
    }
  }

  // Add the deleteVideo method
  deleteVideo(videoId: number) {
    if (confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      this.http.delete<any>(`${this.API_URL}/admin/videos/${videoId}`, {
        headers: this.getHeaders()
      }).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.videos = this.videos.filter(v => v.id !== videoId);
            this.modalService.close();
            this.selectedVideo = null;
            this.successMessage = 'Video deleted successfully';
            setTimeout(() => {
              this.successMessage = null;
            }, 3000);
          }
        },
        error: (error) => {
          console.error('Error deleting video:', error);
          this.error = error.error?.message || 'Failed to delete video. Please try again.';
          setTimeout(() => {
            this.error = null;
          }, 3000);
        }
      });
    }
  }
}
