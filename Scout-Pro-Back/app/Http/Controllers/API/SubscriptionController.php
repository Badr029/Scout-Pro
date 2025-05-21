<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class SubscriptionController extends Controller
{
    /**
     * Display the user's current subscription.
     */
    public function show()
    {
        $user = Auth::user();
        $subscription = $user->subscription;

        // Default to free plan if no subscription record exists
        if (!$subscription) {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'plan' => 'Free',
                    'active' => true,
                    'expires_at' => null,
                    'trial_ends_at' => null,
                    'remaining_uploads' => 3, // Default free tier limit
                ]
            ]);
        }

        // Calculate remaining uploads for free tier
        $remainingUploads = null;
        if ($subscription->plan === 'Free') {
            $monthlyUploads = $user->videos()
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();

            $remainingUploads = max(0, 3 - $monthlyUploads); // 3 is the free tier limit
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'plan' => $subscription->plan,
                'active' => $subscription->active,
                'expires_at' => $subscription->expires_at,
                'trial_ends_at' => $subscription->trial_ends_at,
                'remaining_uploads' => $remainingUploads,
            ]
        ]);
    }

    /**
     * Upgrade the user's subscription.
     */
    public function upgrade(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'cardNumber' => 'required|string',
            'cardName' => 'required|string',
            'expiry' => 'required|string',
            'cvv' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        // In a real app, you would process the payment here
        // using a payment gateway like Stripe

        $user = Auth::user();

        // Check if subscription exists
        $subscription = $user->subscription;

        if ($subscription) {
            // Update existing subscription
            $subscription->update([
                'plan' => 'Premium',
                'active' => true,
                'expires_at' => now()->addMonth(), // Monthly subscription
            ]);
        } else {
            // Create new subscription
            $subscription = Subscription::create([
                'user_id' => $user->id,
                'plan' => 'Premium',
                'active' => true,
                'expires_at' => now()->addMonth(), // Monthly subscription
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Subscription upgraded successfully',
            'data' => $subscription
        ]);
    }

    /**
     * Cancel the user's subscription.
     */
    public function cancel()
    {
        $user = Auth::user();
        $subscription = $user->subscription;

        if (!$subscription || $subscription->plan === 'Free') {
            return response()->json([
                'status' => 'error',
                'message' => 'No active paid subscription found'
            ], 400);
        }

        // In a real app, you would cancel the subscription with the payment provider

        // Update subscription to expire at current billing period end
        $subscription->update([
            'active' => false,
            'canceled_at' => now(),
            // We keep expires_at as is to allow access until the end of the billing period
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Subscription canceled successfully. You will have access until the end of your current billing period.'
        ]);
    }
}
