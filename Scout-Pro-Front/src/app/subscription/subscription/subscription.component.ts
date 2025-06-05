import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss']
})
export class SubscriptionComponent {
  currentPlan: string = 'Free';
  selectedPlanType: 'free' | 'monthly' | 'yearly' | null = null;
  loading: boolean = false;
  error: string = '';
  success: string = '';

  paymentInfo = {
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: ''
  };

  subscriptionPlans = [
    {
      name: 'Free',
      price: 0,
      features: [
        '✔ Limited number of videos per month (e.g., 2-3)',
        '✔ Basic search visibility',
        '❌ No access to scout events'
      ]
    },
    {
      name: 'Premium',
      price: 9.99,
      yearlyPrice: 99.99,
      features: [
        '🚀 Unlimited video uploads',
        '🎖 Premium badge on profile',
        '📥 Apply for scouts\' events'
      ]
    }
  ];

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

 selectPlan(planType: 'free' | 'monthly' | 'yearly'): void {
  this.selectedPlanType = planType;
  this.error = '';
  this.success = '';
}

  goToHome(): void {
    this.router.navigate(['/home']);
  }

  upgradeSubscription(): void {
    if (!this.selectedPlanType) {
      this.error = 'Please select a plan before upgrading.';
      return;
    }

    if (this.selectedPlanType === 'free') {
      this.currentPlan = 'Free';
      this.selectedPlanType = 'free';
      this.success = 'You are now on the Free plan.';
      this.error = '';
      this.paymentInfo = { cardNumber: '', cardName: '', expiry: '', cvv: '' };
      return;
    }

    const payload = {
      plan_type: this.selectedPlanType === 'monthly' ? 'Player Monthly' : 'Player Yearly',
      card_number: this.paymentInfo.cardNumber.replace(/\s+/g, ''),
      cardholder_name: this.paymentInfo.cardName,
      expiry: this.paymentInfo.expiry,
      cvv: this.paymentInfo.cvv
    };

const token = localStorage.getItem('auth_token');
if (!token) {
  this.error = 'User not authenticated. Please log in.';
  return;
}   

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.loading = true;
    this.error = '';
    this.success = '';

    this.http.post('http://127.0.0.1:8000/api/subscription/upgrade', payload, { headers }).subscribe({
       next: (res: any) => {
    this.loading = false;
    this.currentPlan = 'Premium';  // فقط هنا يتم تحديث currentPlan
    this.success = `Subscription upgraded to Premium (${this.selectedPlanType}) successfully!`;
    this.paymentInfo = { cardNumber: '', cardName: '', expiry: '', cvv: '' };
  },
  error: (err: HttpErrorResponse) => {
    this.loading = false;
    this.error = err?.error?.message || 'Upgrade failed. Please check your data.';
  }
});}

  
cancelSubscription(): void {
  this.loading = true;
  this.error = '';
  this.success = '';

  const token = localStorage.getItem('auth_token');
  if (!token) {
    this.error = 'User not authenticated. Please log in.';
    this.loading = false;
    return;
  }

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  this.http.post('http://127.0.0.1:8000/api/subscription/cancel', {}, { headers }).subscribe({
    next: (res: any) => {
      this.loading = false;

      this.currentPlan = 'Free';
      this.selectedPlanType = 'free';

      this.success = res.message || 'Subscription cancelled successfully. You are now on the Free plan.';

      this.paymentInfo = { cardNumber: '', cardName: '', expiry: '', cvv: '' };
    },
    error: (err: HttpErrorResponse) => {
      this.loading = false;
      this.error = err?.error?.message || 'Failed to cancel subscription. Please try again later.';
    }
  });
}



  formatCardNumber(): void {
    if (this.paymentInfo.cardNumber) {
      this.paymentInfo.cardNumber = this.paymentInfo.cardNumber
        .replace(/\s+/g, '')
        .replace(/(\d{4})/g, '$1 ')
        .trim();
    }
  }
}
