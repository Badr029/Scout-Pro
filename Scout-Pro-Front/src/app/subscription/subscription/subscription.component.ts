import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss']
})
export class SubscriptionComponent implements OnInit {
  currentPlan: string | null = null
  currentPlanType: string | null = null; // Track current plan type ('monthly' or 'yearly')
  selectedPlanType: string | null = null;
  loading: boolean = false;
  error: string = '';
  success: string = '';
  userType: string = '';

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
      price: 0,
      yearlyPrice: 0,
      features: [
        '🚀 Unlimited video uploads',
        '🎖 Premium badge on profile',
        '📥 Apply for scouts\' events'
      ]
    }
  ];

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.userType = localStorage.getItem('user_type') || '';
  }

  ngOnInit() {
    
    // if (this.userType === 'player') {
    //   this.checkPlayerMembership();
    // } else {
    //   this.checkSubscriptionStatus();
    // }
    this.fetchPlanPrices();
    
    this.currentPlan =localStorage.getItem('membership')
    this.currentPlanType = localStorage.getItem('plan_type')
    console.log('currentPlanType' , this.currentPlanType);
    console.log(this.currentPlan);

  }

  private checkPlayerMembership() {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    this.http.get('http://localhost:8000/api/player/membership', { headers })
      .subscribe({
        next: (response: any) => {
          if (response.status === 'success' && response.data) {
            this.currentPlan = response.data.membership === 'premium' ? 'Premium' : 'Free';
            // Set current plan type if premium
            if (this.currentPlan === 'Premium') {
              if (response.data.plan_type && typeof response.data.plan_type === 'string') {
                this.currentPlanType = response.data.plan_type.includes('Yearly') ? 'yearly' : 'monthly';
                
              } else {
                this.currentPlanType = 'unknown'; // fallback or handle differently
              }
            }
          }
        },
        error: (error) => {
          console.error('Error checking membership status:', error);
          this.error = 'Failed to check membership status';
        }
      });
  }

  private checkSubscriptionStatus() {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    this.http.get('http://localhost:8000/api/subscription/show', { headers })
      .subscribe({
        next: (response: any) => {
          if (response.status === 'success' && response.data) {
            this.currentPlan = response.data.plan;
            // Set current plan type if premium
            if (this.currentPlan === 'Premium') {
              this.currentPlanType = response.data.plan_type.includes('Yearly') ? 'yearly' : 'monthly';
            }
          }
        },
        error: (error) => {
          console.error('Error checking subscription status:', error);
          this.error = 'Failed to check subscription status';
        }
      });
  }

  private fetchPlanPrices() {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    this.http.get('http://localhost:8000/api/plans', { headers })
      .subscribe({
        next: (response: any) => {
          if (response?.status === 'success' && response?.plans) {
            const monthlyPlan = response.plans.find((plan: any) =>
              plan.name === (this.userType === 'player' ? 'Player Monthly' : 'Scout Monthly')
            );
            const yearlyPlan = response.plans.find((plan: any) =>
              plan.name === (this.userType === 'player' ? 'Player Yearly' : 'Scout Yearly')
            );

            if (monthlyPlan) {
              this.subscriptionPlans[1].price = monthlyPlan.price;
            }
            if (yearlyPlan) {
              this.subscriptionPlans[1].yearlyPrice = yearlyPlan.price;
            }
          }
        },
        error: (error) => {
          console.error('Error fetching plans:', error);
          this.error = `Failed to load subscription plans: ${error.error?.message || 'Please try again later.'}`;
        }
      });
  }

  selectPlan(planType: string): void {
    // Only allow selecting a different plan than current
    if (this.currentPlan !== 'Premium' || this.currentPlanType !== planType) {
      this.selectedPlanType = planType;
      this.error = '';
      this.success = '';
    }
        console.log('current PLan', planType);

  }

  upgradeSubscription(): void {
    if (!this.selectedPlanType) {
      this.error = 'Please select a plan before upgrading.';
      return;
    }

    // if (!this.validatePaymentInfo()) {
    //   this.error = 'Please enter valid payment information.';
    //   return;
    // }

    this.loading = true;
    this.error = '';
    this.success = '';

    const payload = {
      plan_type: this.selectedPlanType === 'monthly' ?
        (this.userType === 'player' ? 'Player Monthly' : 'Scout Monthly') :
        (this.userType === 'player' ? 'Player Yearly' : 'Scout Yearly'),
      card_number: this.paymentInfo.cardNumber.replace(/\s/g, ''),
      cardholder_name: this.paymentInfo.cardName,
      expiry: this.paymentInfo.expiry,
      cvv: this.paymentInfo.cvv
    };

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    const endpoint = 'http://127.0.0.1:8000/api/subscription/upgrade'

    this.http.post(endpoint, payload, { headers })
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          if (response.status === 'success') {
            this.currentPlan = 'Premium';
            this.currentPlanType = this.selectedPlanType;
            this.success = `Successfully upgraded to Premium ${this.selectedPlanType} plan!`;
            this.paymentInfo = { cardNumber: '', cardName: '', expiry: '', cvv: '' };

            // Update local storage
            if (this.userType === 'player') {
              localStorage.setItem('membership', 'premium');
              localStorage.setItem('plan_type', this.selectedPlanType === 'monthly' ? 'monthly' : 'yearly');
            } else {
              localStorage.setItem('subscription_active', 'true');
              localStorage.setItem('plan_type', this.selectedPlanType === 'monthly' ? 'monthly' : 'yearly');
            }

            // Navigate to profile after successful upgrade
            setTimeout(() => {
              const userId = localStorage.getItem('user_id');
              if (userId) {
                this.router.navigate(['/profile', userId]);
              } else {
                this.router.navigate(['/profile']);
              }
            }, 1500);
          }
        },
        error: (error) => {
          this.loading = false;
          this.error = error.error?.message || 'Failed to process payment. Please try again later.';
        }
      });
  }

  private validatePaymentInfo(): boolean {
    return (
      this.paymentInfo.cardNumber.replace(/\s/g, '').length === 16 &&
      this.paymentInfo.cardName.trim().length > 0 &&
      /^\d{2}\/\d{2}$/.test(this.paymentInfo.expiry) &&
      /^\d{3,4}$/.test(this.paymentInfo.cvv)
    );
  }

  cancelSubscription(): void {
    if (this.currentPlan !== 'Premium') {
      this.error = 'No active Premium subscription to cancel.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    const endpoint = this.userType === 'player' ?
      'http://localhost:8000/api/subscription/cancel' :
      'http://localhost:8000/api/subscription/scout/cancel';

    this.http.post(endpoint, {}, { headers })
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          this.currentPlan = 'Free';
          this.currentPlanType = null;
          this.selectedPlanType = null;
          this.success = response.message || 'Subscription cancelled successfully.';
          this.paymentInfo = { cardNumber: '', cardName: '', expiry: '', cvv: '' };

          // Update local storage
          if (this.userType === 'player') {
            localStorage.setItem('membership', 'free');
            localStorage.removeItem('plan_type');
          } else {
            localStorage.setItem('subscription_active', 'false');
            localStorage.removeItem('plan_type');
          }
        },
        error: (error) => {
          this.loading = false;
          this.error = error.error?.message || 'Failed to cancel subscription. Please try again later.';
        }
      });
  }

  // Card formatting methods remain the same
  formatCardNumber(event: any): void {
    let input = event.target.value.replace(/\D/g, '');
    if (input.length > 16) {
      input = input.substr(0, 16);
    }
    const cardNumber = input.replace(/(\d{4})/g, '$1 ').trim();
    this.paymentInfo.cardNumber = cardNumber;
  }

  formatExpiryDate(event: any): void {
    let input = event.target.value.replace(/\D/g, '');
    if (input.length > 4) {
      input = input.substr(0, 4);
    }
    if (input.length >= 2) {
      const month = parseInt(input.substr(0, 2));
      if (month > 12) {
        input = '12' + input.substr(2);
      }
      if (month < 1) {
        input = '01' + input.substr(2);
      }
      input = input.substr(0, 2) + '/' + input.substr(2);
    }
    this.paymentInfo.expiry = input;
  }

  formatCVV(event: any): void {
    let input = event.target.value.replace(/\D/g, '');
    if (input.length > 3) {
      input = input.substr(0, 3);
    }
    this.paymentInfo.cvv = input;
  }

  formatCardholderName(event: any): void {
    let input = event.target.value;
    input = input.replace(/[^a-zA-Z\s]/g, '');
    input = input.toUpperCase();
    this.paymentInfo.cardName = input;
  }

  goToHome(): void {
    this.router.navigate(['/home-feed']);
  }
}