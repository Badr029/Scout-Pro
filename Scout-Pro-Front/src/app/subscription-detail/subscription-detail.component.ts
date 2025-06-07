import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-subscription-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription-detail.component.html',
  styleUrls: ['./subscription-detail.component.css'],
})
export class SubscriptionDetailComponent implements OnInit, OnDestroy {
  subscription: any = null;
  playerId!: number;
  currentPlan: string | null = null;
  currentPlanType: string | null = null;
  selectedPlanType: string | null = null;
  loading: boolean = false;
  error: string = '';
  success: string = '';
  userType: string = '';
  showCancelConfirmation: boolean = false;
  countdownTimer: Subscription | null = null;
  timeRemaining: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  };

  paymentInfo = {
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: ''
  };

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSubscriptionDetails();
  }

  ngOnDestroy(): void {
    if (this.countdownTimer) {
      this.countdownTimer.unsubscribe();
    }
  }

  private startCountdown(): void {
    if (this.countdownTimer) {
      this.countdownTimer.unsubscribe();
    }

    if (!this.subscription || !this.subscription.expires_at) {
      return;
    }

    const expiryDate = new Date(this.subscription.expires_at).getTime();

    this.countdownTimer = interval(1000).subscribe(() => {
      const now = new Date().getTime();
      const distance = expiryDate - now;

      if (distance < 0) {
        if (this.countdownTimer) {
          this.countdownTimer.unsubscribe();
        }
        this.timeRemaining = {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        };
        return;
      }

      this.timeRemaining = {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      };
    });
  }

  loadSubscriptionDetails(): void {
    this.loading = true;
    this.error = '';
    this.playerId = Number(localStorage.getItem('user_id'));
    this.userType = localStorage.getItem('user_type') || 'player';

    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const url = `http://localhost:8000/api/player/${this.playerId}/subscription-status`;

    this.http.get<any>(url, { headers }).subscribe({
      next: (response) => {
        if (response.data) {
          this.subscription = response.data;
          this.currentPlan = response.data.plan || 'Free';
          this.currentPlanType = response.data.plan_type || null;
          this.startCountdown(); // Start the countdown after loading subscription details
        } else {
          this.subscription = {
            plan: 'Free',
            status: 'Inactive',
            days_left: 0,
            hours_left: 0
          };
          this.currentPlan = 'Free';
          this.currentPlanType = null;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching subscription:', err);
        this.loading = false;
        this.error = 'Failed to load subscription details.';
      }
    });
  }

  cancelSubscription(): void {
    if (!this.currentPlan || this.currentPlan.toLowerCase() === 'free') {
      this.error = 'No active paid subscription to cancel.';
      return;
    }

    this.error = '';
    this.success = '';
    this.showCancelConfirmation = true;
  }

  confirmCancel(): void {
    this.showCancelConfirmation = false;
    this.loading = true;
    this.error = '';
    this.success = '';

    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`
    });

    const endpoint = this.userType === 'player'
      ? 'http://localhost:8000/api/subscription/cancel'
      : 'http://localhost:8000/api/subscription/scout/cancel';

    this.http.post(endpoint, {}, { headers }).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.success = 'Subscription cancelled successfully.';

        // Update localStorage
        if (this.userType === 'player') {
          localStorage.setItem('membership', 'free');
          localStorage.removeItem('plan_type');
        } else {
          localStorage.setItem('subscription_active', 'false');
          localStorage.removeItem('plan_type');
        }

        // Reload subscription details to get updated status
        setTimeout(() => {
          this.loadSubscriptionDetails();
        }, 1000);
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Failed to cancel subscription.';
      }
    });
  }

  goToUpgrade(): void {
    this.router.navigate(['/subscription']);
  }

  goBack(): void {
    this.router.navigate(['/profile']);
  }
}
