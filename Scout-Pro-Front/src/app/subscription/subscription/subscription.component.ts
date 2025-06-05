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
  currentPlan: string = 'Free';
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
      price: 0, // Will be updated from backend
      yearlyPrice: 0, // Will be updated from backend
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
    if (this.userType === 'player') {
      this.checkPlayerMembership();
    } else {
      this.checkSubscriptionStatus();
    }
    this.fetchPlanPrices();
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
          console.log('Plans response:', response);

          if (response?.status === 'success' && response?.plans) {
            console.log('Available plans:', response.plans);

            const monthlyPlan = response.plans.find((plan: any) =>
              plan.name === (this.userType === 'player' ? 'Player Monthly' : 'Scout Monthly')
            );
            const yearlyPlan = response.plans.find((plan: any) =>
              plan.name === (this.userType === 'player' ? 'Player Yearly' : 'Scout Yearly')
            );

            console.log('Monthly plan:', monthlyPlan);
            console.log('Yearly plan:', yearlyPlan);

            if (monthlyPlan) {
              this.subscriptionPlans[1].price = monthlyPlan.price;
              console.log('Set monthly price:', this.subscriptionPlans[1].price);
            } else {
              console.warn('Monthly plan not found in response');
            }

            if (yearlyPlan) {
              this.subscriptionPlans[1].yearlyPrice = yearlyPlan.price;
              console.log('Set yearly price:', this.subscriptionPlans[1].yearlyPrice);
            } else {
              console.warn('Yearly plan not found in response');
            }
          } else {
            console.warn('Invalid response format:', response);
            this.error = 'Failed to load subscription plans: Invalid response format';
          }
        },
        error: (error) => {
          console.error('Error fetching plans:', error);
          this.error = `Failed to load subscription plans: ${error.error?.message || 'Please try again later.'}`;
        }
      });
  }

  selectPlan(planType: string): void {
    if (this.currentPlan !== 'Premium' || this.selectedPlanType !== planType) {
      this.selectedPlanType = planType;
      this.error = '';
      this.success = '';
    }
  }

  upgradeSubscription(): void {
    if (!this.selectedPlanType) {
      this.error = 'Please select a plan before upgrading.';
      return;
    }

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

    const endpoint = this.userType === 'player' ?
      'http://localhost:8000/api/player/membership/upgrade' :
      'http://localhost:8000/api/subscription/scout/upgrade';

    this.http.post(endpoint, payload, { headers })
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          if (response.status === 'success') {
            this.currentPlan = 'Premium';
            this.success = `Subscription upgraded to Premium (${this.selectedPlanType}) successfully!`;
            this.paymentInfo = { cardNumber: '', cardName: '', expiry: '', cvv: '' };

            // Update localStorage to reflect subscription status
            if (this.userType === 'player') {
              localStorage.setItem('membership', 'premium');
            } else {
              localStorage.setItem('subscription_active', 'true');
            }

            // Show success message and navigate after a short delay
            setTimeout(() => {
              this.router.navigate(['/home-feed'])
                .then(() => console.log('Navigation to home-feed successful'))
                .catch(err => {
                  console.error('Navigation failed:', err);
                  this.error = 'Failed to redirect. Please try again.';
                });
            }, 1500);
          } else {
            this.error = response.message || 'Subscription upgrade failed. Please try again.';
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Payment error:', error);
          this.error = error.error?.message || 'Failed to process payment. Please try again later.';
        }
      });
  }

  cancelSubscription(): void {
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
          this.selectedPlanType = null;
          this.success = response.message || 'Subscription cancelled successfully.';
          this.paymentInfo = { cardNumber: '', cardName: '', expiry: '', cvv: '' };

          // Update localStorage
          if (this.userType === 'player') {
            localStorage.setItem('membership', 'free');
          } else {
            localStorage.setItem('subscription_active', 'false');
          }
        },
        error: (error) => {
          this.loading = false;
          this.error = error.error?.message || 'Failed to cancel subscription. Please try again later.';
        }
      });
  }

  // Card formatting methods
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

  logout(): void {
    this.loading = true;
    this.authService.logout().then(() => {
      this.loading = false;
      // Navigation will be handled by the AuthService
    }).catch(error => {
      this.loading = false;
      console.error('Logout error:', error);
      this.error = 'Failed to logout. Please try again.';
    });
  }

  goToHome(): void {
    this.router.navigate(['/home-feed'])
      .then(() => console.log('Navigation to home-feed successful'))
      .catch(err => {
        console.error('Navigation failed:', err);
        this.error = 'Failed to navigate to home. Please try again.';
      });
  }
}
