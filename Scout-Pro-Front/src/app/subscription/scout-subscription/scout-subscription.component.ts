import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scout-subscription',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './scout-subscription.component.html',
  styleUrls: ['./scout-subscription.component.scss']
})
export class ScoutSubscriptionComponent {
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
      price: 9.99, // Monthly
      yearlyPrice: 99.99, // Yearly
      features: [
        '📩 Contact Players Directly',
        '📢 Announce Events and Trials',
        '🔍Advanced filtering options',
        '👁️Follow the player interested in monitoring',
      ]
    }
  ];

  constructor(private router: Router) {}

  // Select a plan (monthly or yearly)
  selectPlan(planType: string): void {
    if (this.currentPlan !== 'Premium' || this.selectedPlanType !== planType) {
      this.selectedPlanType = planType;
      this.error = '';
      this.success = '';
    }
  }

  // Navigate back to home
  goToHome(): void {
    this.router.navigate(['/home']);
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

    // Simulate API call for payment processing
    setTimeout(() => {
      this.loading = false;

      // Simulate 80% success rate
      const paymentSuccess = Math.random() > 0.2;

      if (paymentSuccess) {
        this.currentPlan = 'Premium';
        this.success = `Subscription upgraded to Premium (${this.selectedPlanType}) successfully!`;
        this.paymentInfo = { cardNumber: '', cardName: '', expiry: '', cvv: '' }; // Clear form
      } else {
        this.error = 'Payment failed. Please check your card details and try again.';
      }
    }, 1500);
  }

  // Handle subscription cancellation
  cancelSubscription(): void {
    this.loading = true;
    this.error = '';
    this.success = '';

    // Simulate cancellation
    setTimeout(() => {
      this.loading = false;

      // Simulate 90% success rate
      const cancellationSuccess = Math.random() > 0.1;

      if (cancellationSuccess) {
        this.currentPlan = 'Free';
        this.selectedPlanType = null;
        this.success = 'Subscription cancelled successfully.';
      } else {
        this.error = 'Failed to cancel subscription. Please try again later.';
      }
    }, 1500);
  }

  // Format card number with spaces every 4 digits
  formatCardNumber(): void {
    if (this.paymentInfo.cardNumber) {
      this.paymentInfo.cardNumber = this.paymentInfo.cardNumber
        .replace(/\s+/g, '')
        .replace(/(\d{4})/g, '$1 ')
        .trim();
    }
  }
}
