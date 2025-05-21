import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.css']
})
export class SubscriptionComponent implements OnInit {
  currentPlan: string = 'Free';
  loading = false;
  error = '';
  success = '';
  paymentInfo = {
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
  };
  subscriptionPlans = [
    {
      name: 'Free',
      price: 0,
      features: [
        'Limited video uploads (3 per month)',
        'Basic profile visibility',
        'Basic stats',
        'See number of scout requests'
      ]
    },
    {
      name: 'Premium',
      price: 9.99,
      features: [
        'Unlimited video uploads',
        'Priority in search results',
        'Detailed video analytics',
        'Get notified when scouts view your profile',
        'See which scouts requested contact',
        'Premium badge on profile'
      ]
    }
  ];

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.getUserSubscription();
  }

  getUserSubscription() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any>('http://localhost:8000/api/subscription', { headers })
      .subscribe({
        next: (response) => {
          this.currentPlan = response.data.plan || 'Free';
        },
        error: (error) => {
          this.error = error.error.message || 'Failed to load subscription data';
        }
      });
  }

  upgradeSubscription() {
    if (!this.validatePaymentInfo()) {
      this.error = 'Please fill in all payment details correctly';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Send payment info to the backend
    this.http.post<any>('http://localhost:8000/api/subscription/upgrade', this.paymentInfo, { headers })
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.success = 'Successfully upgraded to Premium!';
          this.currentPlan = 'Premium';
          // Reset form
          this.paymentInfo = {
            cardNumber: '',
            cardName: '',
            expiry: '',
            cvv: '',
          };
          // Redirect after a brief delay
          setTimeout(() => {
            this.router.navigate(['/profile']);
          }, 2000);
        },
        error: (error) => {
          this.loading = false;
          this.error = error.error.message || 'Payment failed. Please try again.';
        }
      });
  }

  cancelSubscription() {
    this.loading = true;
    this.error = '';
    this.success = '';

    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Send request to cancel subscription
    this.http.post<any>('http://localhost:8000/api/subscription/cancel', {}, { headers })
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.success = 'Successfully downgraded to Free plan. Changes will take effect at the end of your billing period.';
          // Refresh the subscription status
          this.getUserSubscription();
        },
        error: (error) => {
          this.loading = false;
          this.error = error.error.message || 'Failed to cancel subscription. Please try again.';
        }
      });
  }

  validatePaymentInfo(): boolean {
    // Basic validation
    return (
      this.paymentInfo.cardNumber.replace(/\s/g, '').length === 16 &&
      this.paymentInfo.cardName.trim() !== '' &&
      this.paymentInfo.expiry.trim() !== '' &&
      this.paymentInfo.cvv.trim().length >= 3
    );
  }

  goBack() {
    this.router.navigate(['/profile']);
  }
}
