import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Chart } from 'chart.js/auto';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth.service';

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

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  stats = {
    totalUsers: 0,
    totalPlayers: 0,
    totalScouts: 0,
    totalVideos: 0,
    totalLikes: 0,
    totalComments: 0,
    totalFollows: 0
  };

  currentSection: 'statistics' | 'contact-requests' | 'event-requests' = 'statistics';
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
  loading = true;
  error: string | null = null;

  private readonly API_URL = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadStats();
    this.loadCharts();
    this.loadContactRequests();
    this.loadEventRequests();
  }

  ngOnDestroy() {
    // Cleanup charts to prevent memory leaks
    [this.userGrowthChart, this.engagementChart, this.videoStatsChart].forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
  }

  setSection(section: 'statistics' | 'contact-requests' | 'event-requests') {
    this.currentSection = section;
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
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
}
