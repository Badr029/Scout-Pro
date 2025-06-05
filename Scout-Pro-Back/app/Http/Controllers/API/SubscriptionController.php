<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\User;
use App\Models\Player;
use App\Models\Scout;
use App\Models\Plan;
use App\Models\Payment;
use App\Models\Invoice;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Crypt;
use Carbon\Carbon;
use Illuminate\Http\Request;




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
            $monthlyUploads = $user->player ? $user->player->videos()
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count() : 0;

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

     public function checkSubscriptionStatus($playerId)
{
    $player = Player::findOrFail($playerId);
$subscription = Subscription::where('user_id', $player->user_id)->latest()->first();

    if (!$subscription) {
        Player::where('id', $playerId)->update(['membership' => 'free']);
        return response()->json([
            'status' => 'no_subscription',
            'membership' => 'free',
            'days_remaining' => 0
        ]);
    }

    $expires_at = $subscription->expires_at;
    $now = now();

    if ($expires_at && $expires_at <= $now) {
        Player::where('id', $playerId)->update(['membership' => 'free']);
        return response()->json([
            'status' => 'expired',
            'membership' => 'free',
            'days_remaining' => 0
        ]);
    }
    $days_remaining = $now->diffInDays($expires_at);

    return response()->json([
        'status' => 'active',
        'membership' => 'Premium',
        'days_remaining' => $days_remaining
    ]);
}


private function isExpiryValid(string $expiry): bool
{
    [$month, $year] = explode('/', $expiry);
    $month = (int) $month;
    $year = (int) ('20' . $year);
    $now = now();

    $expiryDate = \Carbon\Carbon::createFromDate($year, $month, 1)->endOfMonth();

    return $expiryDate->isFuture();
}

public function upgrade(Request $request)
{
    $user = Auth::user();
    $validator = Validator::make($request->all(), [
        'plan_type' => 'required|in:Player Monthly,Player Yearly',
        'card_number' => ['required', 'regex:/^\d{16}$/'],
        'cardholder_name' => ['required', 'regex:/^[a-zA-Z\s]+$/'],
        'expiry' => ['required', 'regex:/^(0[1-9]|1[0-2])\/\d{2}$/'],
        'cvv' => ['required', 'regex:/^\d{3,4}$/'],
    ]);

    if ($validator->fails()) {
        return response()->json([
            'status' => 'error',
            'message' => $validator->errors()->first()
        ], 422);
    }

    $expiry = $request->input('expiry');
    if (!$this->isExpiryValid($expiry)) {
        return response()->json([
            'status' => 'error',
            'message' => 'Expiry date is invalid or has passed.'
        ], 422);
    }
    $plan = Plan::where('name', $request->plan_type)->first();
    if (!$plan) {
        return response()->json(['status' => 'error', 'message' => 'Invalid plan selected'], 404);
    }

    $player = $user->player;
    if (!$player) {
        return response()->json(['status' => 'error', 'message' => 'Player profile not found'], 404);
    }

    $encryptedCard = Crypt::encryptString($request->card_number);
    $encryptedCVV = Crypt::encryptString($request->cvv);
    $lastFour = substr($request->card_number, -4);

    $payment = Payment::create([
        'amount' => $plan->Price ?? null,
        'card_number_encrypted' => $encryptedCard,
        'card_last_four' => $lastFour,
        'expiry' => $request->expiry,
        'cvv_encrypted' => $encryptedCVV,
        'cardholder_name' => $request->cardholder_name,
    ]);


    $subscription = Subscription::updateOrCreate(
        ['user_id' => $user->id],
        [
            'player_id' => $player->id,
            'plan_id' => $plan->id,
            'payment_id' => $payment->id,
            'plan' => $plan->Name,
            'active' => $plan->Price > 0,
            'expires_at' => $plan->Price > 0 ? now()->addDays($plan->duration) : null,
            'canceled_at' => null
        ]
    );
    //3shan elmembership

    $player->update([
        'membership' => $plan->Price > 0 ? 'Premium' : 'Free',
    ]);

    return response()->json([
        'message' => 'Subscription upgraded and payment saved.',
        'data' => [
            'subscription' => $subscription,
            'payment_id' => $payment->id,
            'card_last_four' => $lastFour,
        ]
    ]);
}

    /**
     * Cancel the user's subscription.
     */
    public function cancel()
    {


    $user = Auth::user();
    $subscription = $user->subscription;
    $player = $user->player;

    if (!$subscription || $subscription->plan === 'Free') {
        return response()->json([
            'status' => 'error',
            'message' => 'No active paid subscription found'
        ], 400);
    }


    $subscription->update([
        'plan' => 'Free',
        'membership' => 'free',
        'active' => false,
        'canceled_at' => now(),
        'expires_at' => now(),
    ]);


    if ($player) {
        $player->membership = 'free';
        $player->save();
    }

    return response()->json([
        'status' => 'success',
        'message' => 'Subscription canceled successfully. You are now on the Free plan.'
    ]);
}

    /**
     * Get all available subscription plans.
     */
    public function getPlans()
    {
        try {
            // Get all plans first to debug
            $allPlans = Plan::all();
            Log::info('All available plans:', ['plans' => $allPlans->toArray()]);

            // Get scout plans
            $plans = Plan::whereIn('Name', ['Scout Monthly', 'Scout Yearly'])->get();
            Log::info('Fetched scout plans:', ['plans' => $plans->toArray()]);

            if ($plans->isEmpty()) {
                Log::warning('No scout plans found in the database');
                return response()->json([
                    'status' => 'error',
                    'message' => 'No subscription plans found'
                ], 404);
            }

            // Transform the data to ensure proper casing
            $transformedPlans = $plans->map(function ($plan) {
                return [
                    'id' => $plan->id,
                    'name' => $plan->Name,
                    'duration' => $plan->Duration,
                    'price' => (int)$plan->Price // Ensure price is an integer
                ];
            });

            Log::info('Transformed plans:', ['transformed_plans' => $transformedPlans->toArray()]);

            return response()->json([
                'status' => 'success',
                'plans' => $transformedPlans
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching plans:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch subscription plans: ' . $e->getMessage()
            ], 500);
        }
    }

    public function upgradeScout(Request $request)
    {
        $user = Auth::user();
        $validator = Validator::make($request->all(), [
            'plan_type' => 'required|in:Scout Monthly,Scout Yearly',
            'card_number' => ['required', 'regex:/^\d{16}$/'],
            'cardholder_name' => ['required', 'regex:/^[a-zA-Z\s]+$/'],
            'expiry' => ['required', 'regex:/^(0[1-9]|1[0-2])\/\d{2}$/'],
            'cvv' => ['required', 'regex:/^\d{3,4}$/'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first()
            ], 422);
        }

        $expiry = $request->input('expiry');
        if (!$this->isExpiryValid($expiry)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Expiry date is invalid or has passed.'
            ], 422);
        }

        $plan = Plan::where('name', $request->plan_type)->first();
        if (!$plan) {
            return response()->json(['status' => 'error', 'message' => 'Invalid plan selected'], 404);
        }

        $scout = $user->scout;
        if (!$scout) {
            return response()->json(['status' => 'error', 'message' => 'Scout profile not found'], 404);
        }

        $encryptedCard = Crypt::encryptString($request->card_number);
        $encryptedCVV = Crypt::encryptString($request->cvv);
        $lastFour = substr($request->card_number, -4);

        $payment = Payment::create([
            'amount' => $plan->Price ?? null,
            'card_number_encrypted' => $encryptedCard,
            'card_last_four' => $lastFour,
            'expiry' => $request->expiry,
            'cvv_encrypted' => $encryptedCVV,
            'cardholder_name' => $request->cardholder_name,
        ]);

        // Create invoice
        $invoice = Invoice::create([
            'payment_id' => $payment->id,
            'IssueDate' => now(),
            'Status' => 'Paid'
        ]);

        $subscription = Subscription::updateOrCreate(
            ['user_id' => $user->id],
            [
                'plan_id' => $plan->id,
                'payment_id' => $payment->id,
                'plan' => $plan->Name,
                'active' => true,
                'expires_at' => now()->addDays($plan->Duration),
                'canceled_at' => null
            ]
        );

        // Update scout subscription fields
        $scout->update([
            'subscription_id' => $subscription->id,
            'subscription_active' => true,
            'subscription_expires_at' => now()->addDays($plan->Duration)
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Subscription upgraded successfully',
            'data' => [
                'subscription' => $subscription,
                'payment_id' => $payment->id,
                'card_last_four' => $lastFour,
            ]
        ]);
    }

    public function cancelScout()
    {
        $user = Auth::user();
        $scout = $user->scout;

        if (!$scout) {
            return response()->json([
                'status' => 'error',
                'message' => 'Scout profile not found'
            ], 404);
        }

        $subscription = $user->subscription;

        if (!$subscription || $subscription->plan === 'Free') {
            return response()->json([
                'status' => 'error',
                'message' => 'No active paid subscription found'
            ], 400);
        }

        $subscription->update([
            'active' => false,
            'canceled_at' => now(),
            'expires_at' => now(),
        ]);

        $scout->update([
            'subscription_active' => false,
            'subscription_expires_at' => now()
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Subscription canceled successfully'
        ]);
    }

    public function checkScoutSubscriptionStatus($scoutId)
    {
        $scout = Scout::findOrFail($scoutId);
        $subscription = Subscription::where('user_id', $scout->user_id)->latest()->first();

        if (!$subscription || !$scout->subscription_active) {
            return response()->json([
                'status' => 'no_subscription',
                'subscription_active' => false,
                'days_remaining' => 0
            ]);
        }

        $expires_at = $subscription->expires_at;
        $now = now();

        if ($expires_at && $expires_at <= $now) {
            $scout->update(['subscription_active' => false]);
            return response()->json([
                'status' => 'expired',
                'subscription_active' => false,
                'days_remaining' => 0
            ]);
        }

        $days_remaining = $now->diffInDays($expires_at);

        return response()->json([
            'status' => 'active',
            'subscription_active' => true,
            'days_remaining' => $days_remaining
        ]);
    }

    public function getScoutSubscriptionStatus()
    {
        $user = Auth::user();
        $scout = $user->scout;

        if (!$scout) {
            return response()->json([
                'subscription_active' => false,
                'message' => 'Scout profile not found'
            ]);
        }

        $subscription = $user->subscription;

        if (!$subscription || !$scout->subscription_active) {
            return response()->json([
                'subscription_active' => false,
                'message' => 'No active subscription'
            ]);
        }

        $expires_at = $subscription->expires_at;
        if ($expires_at && $expires_at <= now()) {
            $scout->update(['subscription_active' => false]);
            return response()->json([
                'subscription_active' => false,
                'message' => 'Subscription expired'
            ]);
        }

        return response()->json([
            'subscription_active' => true,
            'expires_at' => $expires_at,
            'plan' => $subscription->plan
        ]);
    }

}
