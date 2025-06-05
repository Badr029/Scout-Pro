import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-scout-subscription',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './scout-subscription.component.html',
  styleUrls: ['./scout-subscription.component.scss']
})
export class ScoutSubscriptionComponent implements OnInit {
  // Current user's plan
  currentPlan: string = 'Free'; // Default to Free

  // Selected plan type ('monthly' or 'yearly')
  selectedPlanType: string | null = null;

  // Loading state
  loading: boolean = false;

  // Messages
  error: string = '';
  success: string = '';

  // Payment information
  paymentInfo = {
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: ''
  };

  // Subscription plans data
  subscriptionPlans = [
    {
      name: 'Free',
      price: 0,
      features: [
        '🔍Advanced filtering options',
        'Age groups',
        'Positions',
        'Regions',
        'Transfer status',
        '👁️Follow the player interested in monitoring',
        '📩Get the Contact information of the players you interested in'
      ]
    },
    {
      name: 'Premium',
      price: 0, // Will be updated from backend
      yearlyPrice: 0, // Will be updated from backend
      features: [
        '📩 Contact Players Directly',
        '📢 Announce Events and Trials',
        '🔍Advanced filtering options',
        '👁️Follow the player interested in monitoring',
      ]
    }
  ];

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.checkSubscriptionStatus();
    this.fetchPlanPrices();
  }

  private checkSubscriptionStatus() {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    this.http.get('http://localhost:8000/api/subscription/scout/status', { headers })
      .subscribe({
        next: (response: any) => {
          if (response.subscription_active) {
            // If subscription is active, redirect to feed
            this.router.navigate(['/feed']);
          } else {
            // Stay on subscription page
            this.currentPlan = 'Free';
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
          console.log('Plans response:', response); // Debug log

          if (response?.status === 'success' && response?.plans) {
            console.log('Available plans:', response.plans); // Debug log

            const monthlyPlan = response.plans.find((plan: any) => plan.name === 'Scout Monthly');
            const yearlyPlan = response.plans.find((plan: any) => plan.name === 'Scout Yearly');

            console.log('Monthly plan:', monthlyPlan); // Debug log
            console.log('Yearly plan:', yearlyPlan); // Debug log

            if (monthlyPlan) {
              this.subscriptionPlans[1].price = monthlyPlan.price; // Convert from cents to dollars/currency
              console.log('Set monthly price:', this.subscriptionPlans[1].price); // Debug log
            } else {
              console.warn('Monthly plan not found in response');
            }

            if (yearlyPlan) {
              this.subscriptionPlans[1].yearlyPrice = yearlyPlan.price; // Convert from cents to dollars/currency
              console.log('Set yearly price:', this.subscriptionPlans[1].yearlyPrice); // Debug log
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

  // Select a plan (monthly or yearly)
  selectPlan(planType: string): void {
    if (this.currentPlan !== 'Premium' || this.selectedPlanType !== planType) {
      this.selectedPlanType = planType;
      this.error = '';
      this.success = '';
    }
  }

  // Handle subscription upgrade
  upgradeSubscription(): void {
    if (!this.selectedPlanType) {
      this.error = 'Please select a plan before upgrading.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const planType = this.selectedPlanType === 'monthly' ? 'Scout Monthly' : 'Scout Yearly';

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    const payload = {
      plan_type: planType,
      card_number: this.paymentInfo.cardNumber.replace(/\s/g, ''),
      cardholder_name: this.paymentInfo.cardName,
      expiry: this.paymentInfo.expiry,
      cvv: this.paymentInfo.cvv
    };

    this.http.post('http://localhost:8000/api/subscription/scout/upgrade', payload, { headers })
      .subscribe({
        next: (response: any) => {
      this.loading = false;
          if (response.status === 'success') {
        this.currentPlan = 'Premium';
        this.success = `Subscription upgraded to Premium (${this.selectedPlanType}) successfully!`;

            // Clear payment form
            this.paymentInfo = { cardNumber: '', cardName: '', expiry: '', cvv: '' };

            // Update localStorage to reflect subscription status
            localStorage.setItem('subscription_active', 'true');

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

  // Handle subscription cancellation
  cancelSubscription(): void {
    this.loading = true;
    this.error = '';
    this.success = '';

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    this.http.post('http://localhost:8000/api/subscription/scout/cancel', {}, { headers })
      .subscribe({
        next: (response: any) => {
      this.loading = false;
          if (response.status === 'success') {
        this.currentPlan = 'Free';
        this.selectedPlanType = null;
        this.success = 'Subscription cancelled successfully.';
      } else {
            this.error = response.message || 'Failed to cancel subscription.';
          }
        },
        error: (error) => {
          this.loading = false;
          this.error = error.error?.message || 'Failed to cancel subscription. Please try again later.';
      }
      });
  }

  // Format card number as user types
  formatCardNumber(event: any): void {
    let input = event.target.value.replace(/\D/g, ''); // Remove non-digits

    // Limit to 16 digits
    if (input.length > 16) {
      input = input.substr(0, 16);
    }

    // Add spaces after every 4 digits
    const cardNumber = input.replace(/(\d{4})/g, '$1 ').trim();
    this.paymentInfo.cardNumber = cardNumber;
  }

  // Format expiry date as user types (MM/YY)
  formatExpiryDate(event: any): void {
    let input = event.target.value.replace(/\D/g, ''); // Remove non-digits

    // Limit to 4 digits
    if (input.length > 4) {
      input = input.substr(0, 4);
    }

    // Format as MM/YY
    if (input.length >= 2) {
      const month = parseInt(input.substr(0, 2));
      // Validate month (01-12)
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

  // Format CVV as user types
  formatCVV(event: any): void {
    let input = event.target.value.replace(/\D/g, ''); // Remove non-digits

    // Limit to 3 digits
    if (input.length > 3) {
      input = input.substr(0, 3);
    }

    this.paymentInfo.cvv = input;
  }

  // Format cardholder name
  formatCardholderName(event: any): void {
    let input = event.target.value;
    // Allow only letters and spaces
    input = input.replace(/[^a-zA-Z\s]/g, '');
    // Convert to uppercase
    input = input.toUpperCase();
    this.paymentInfo.cardName = input;
  }

  // Validate card number using Luhn algorithm
  isValidCardNumber(cardNumber: string): boolean {
    const number = cardNumber.replace(/\D/g, '');
    if (number.length !== 16) return false;

    let sum = 0;
    let isEven = false;

    // Loop through values starting from the rightmost digit
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number.charAt(i));

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  // Logout method
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
}
