import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss']
})
export class SubscriptionComponent {
  // Current user's plan
  currentPlan: string = 'Free'; // Default to Free, change as needed

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
        '✔ Limited number of videos per month (e.g., 2-3)',
        '✔ Basic search visibility',
        '❌ No access to scout events'
      ]
    },
    {
      name: 'Premium',
      price: 9.99, // Monthly price
      yearlyPrice: 99.99, // Yearly price
      features: [
        '🚀 Unlimited video uploads',
        '🎖 Premium badge on profile',
        '📥 Apply for scouts\' events'
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

      // Simulate successful payment (80% success rate for demo)
      const paymentSuccess = Math.random() > 0.2;

      if (paymentSuccess) {
        this.currentPlan = 'Premium';
        this.success = `Subscription upgraded to Premium (${this.selectedPlanType}) successfully!`;
        this.paymentInfo = {
          cardNumber: '',
          cardName: '',
          expiry: '',
          cvv: ''
        }; // Clear form
        // Keep selectedPlanType to show active state
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

    // Simulate API call for cancellation
    setTimeout(() => {
      this.loading = false;

      // Simulate successful cancellation (90% success rate for demo)
      const cancellationSuccess = Math.random() > 0.1;

      if (cancellationSuccess) {
        this.currentPlan = 'Free';
        this.selectedPlanType = null; // Reset selected plan
        this.success = 'Subscription cancelled successfully.';
      } else {
        this.error = 'Failed to cancel subscription. Please try again later.';
      }
    }, 1500);
  }

  // Helper method to format card number
  formatCardNumber(): void {
    if (this.paymentInfo.cardNumber) {
      this.paymentInfo.cardNumber = this.paymentInfo.cardNumber
        .replace(/\s+/g, '')
        .replace(/(\d{4})/g, '$1 ')
        .trim();
    }
  }
}
