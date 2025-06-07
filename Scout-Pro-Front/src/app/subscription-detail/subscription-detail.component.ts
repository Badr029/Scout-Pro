import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subscription-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription-detail.component.html',
  styleUrls: ['./subscription-detail.component.css'],
})
export class SubscriptionDetailComponent implements OnInit {
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
    this.playerId = +this.route.snapshot.paramMap.get('id')!;
    this.userType = localStorage.getItem('user_type') || 'player';

    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const url = `http://localhost:8000/api/player/subscription-status`;

    this.http.get<any>(url, { headers }).subscribe({
      next: (response) => {
        this.subscription = response.data;
        this.currentPlan = response.data?.plan || null;
        this.currentPlanType = response.data?.plan_type || null;
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
    if (!this.currentPlan || this.currentPlan.toLowerCase().includes('free')) {
      this.error = 'No active paid subscription to cancel.';
      return;
    }

    this.error = '';
    this.success = '';
    this.showCancelConfirmation = true; // ✅ just show confirmation modal
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
        this.currentPlan = 'Free';
        this.currentPlanType = null;
        this.selectedPlanType = null;
        this.success = response.message || 'Subscription cancelled successfully.';
        this.paymentInfo = { cardNumber: '', cardName: '', expiry: '', cvv: '' };

        if (this.userType === 'player') {
          localStorage.setItem('membership', 'free');
          localStorage.removeItem('plan_type');
        } else {
          localStorage.setItem('subscription_active', 'false');
          localStorage.removeItem('plan_type');
        }

        setTimeout(() => {
          this.router.navigate([`/player/${this.playerId}/profile`]);
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
  goBack():void{
    this.router.navigate(['/profile']);
  }
}
