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
use Illuminate\Support\Facades\Mail;
use App\Mail\SubscriptionInvoice;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

use App\Models\PlayerInvoice;
use App\Mail\PlayerSubscriptionInvoice;

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

    try {
        DB::beginTransaction();

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

        // Create payment record
        $payment = Payment::create([
            'user_id' => $user->id,
            'amount' => $plan->Price,
            'currency' => 'EGP',
            'payment_method' => 'card',
            'card_number_encrypted' => $encryptedCard,
            'card_last_four' => $lastFour,
            'expiry' => $request->expiry,
            'cvv_encrypted' => $encryptedCVV,
            'cardholder_name' => $request->cardholder_name,
            'status' => 'completed'
        ]);

        // Create or update subscription
       Subscription::where('user_id', $user->id)->where('active', true)->update([
    'active' => false,
    'canceled_at' => now()
]);

$subscription = Subscription::create([
    'user_id' => $user->id,
    'plan_id' => $plan->id,
    'payment_id' => $payment->id,
    'plan' => $plan->Name,
    'active' => true,
    'start_date' => now(),
    'expires_at' => now()->addDays($plan->Duration),
    'canceled_at' => null
]);


        // Update player membership and subscription fields
        $player->update([
            'membership' => 'premium',
            'subscription_id' => $subscription->id,
            'subscription_expires_at' => now()->addDays($plan->Duration)
        ]);

        // Create regular invoice
        $invoice = Invoice::create([
            'payment_id' => $payment->id,
            'IssueDate' => now(),
            'Status' => 'Paid'
        ]);

        // Create player invoice
        $playerInvoice = PlayerInvoice::create([
            'payment_id' => $payment->id,
            'player_id' => $player->id,
            'invoice_number' => 'INV-' . date('Y') . '-' . str_pad($payment->id, 6, '0', STR_PAD_LEFT),
            'amount' => $plan->Price,
            'currency' => 'EGP',
            'status' => 'paid',
            'paid_at' => now()
        ]);

        // Send invoice email
        try {
            Mail::to($user->email)->send(new PlayerSubscriptionInvoice([
                'player_name' => $user->first_name . ' ' . $user->last_name,
                'plan_name' => $plan->Name,
                'amount' => $plan->Price,
                'invoice_number' => $playerInvoice->invoice_number,
                'invoice_date' => $playerInvoice->created_at->format('F j, Y'),
                'card_last_four' => $lastFour,
                'expiry_date' => $subscription->expires_at->format('F j, Y')
            ]));
        } catch (\Exception $e) {
            Log::error('Failed to send player invoice email: ' . $e->getMessage());
            // Don't return error to user as subscription was successful
        }

        DB::commit();

        return response()->json([
            'status' => 'success',
            'message' => 'Subscription upgraded successfully',
            'data' => [
                'subscription' => $subscription,
                'payment_id' => $payment->id,
                'card_last_four' => $lastFour,
                'invoice_number' => $playerInvoice->invoice_number
            ]
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Player subscription upgrade failed: ' . $e->getMessage());
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to upgrade subscription: ' . $e->getMessage()
        ], 500);
    }
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
            $user = Auth::user();
            $userType = $user->player ? 'player' : 'scout';

            // Get all plans first to debug
            $allPlans = Plan::all();
            Log::info('All available plans:', ['plans' => $allPlans->toArray()]);

            // Get plans based on user type
            $planTypes = $userType === 'player'
                ? ['Player Monthly', 'Player Yearly']
                : ['Scout Monthly', 'Scout Yearly'];

            $plans = Plan::whereIn('Name', $planTypes)->get();
            Log::info('Fetched ' . $userType . ' plans:', ['plans' => $plans->toArray()]);

            if ($plans->isEmpty()) {
                Log::warning('No ' . $userType . ' plans found in the database');
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

        try {
            DB::beginTransaction();

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

            // Create payment record with all required fields
            $payment = new Payment([
                'user_id' => $user->id,
                'amount' => $plan->Price,
                'card_number_encrypted' => $encryptedCard,
                'card_last_four' => $lastFour,
                'expiry' => $request->expiry,
                'cvv_encrypted' => $encryptedCVV,
                'cardholder_name' => $request->cardholder_name
            ]);
            $payment->save();

            // Create invoice
            $invoice = Invoice::create([
                'payment_id' => $payment->id,
                'IssueDate' => now(),
                'Status' => 'Paid'
            ]);

            // Create or update subscription
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

            // Send invoice email
            try {
                Mail::to($user->email)->send(new SubscriptionInvoice([
                    'scout_name' => $user->first_name . ' ' . $user->last_name,
                    'plan_name' => $plan->Name,
                    'amount' => $plan->Price,
                    'invoice_number' => $invoice->id,
                    'invoice_date' => $invoice->IssueDate->format('F j, Y'),
                    'card_last_four' => $lastFour,
                    'expiry_date' => $subscription->expires_at->format('F j, Y')
                ]));
            } catch (\Exception $e) {
                Log::error('Failed to send invoice email: ' . $e->getMessage());
                // Don't return error to user as subscription was successful
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Subscription upgraded successfully',
                'data' => [
                    'subscription' => $subscription,
                    'payment_id' => $payment->id,
                    'card_last_four' => $lastFour,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Scout subscription upgrade failed: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to upgrade subscription: ' . $e->getMessage()
            ], 500);
        }
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

    /**
     * Check player membership status
     */
    public function checkPlayerMembership(Request $request)
    {
        $user = Auth::user();
        $player = $user->player;

        if (!$player) {
            return response()->json([
                'status' => 'error',
                'message' => 'Player not found'
            ], 404);
        }

        $subscription = Subscription::where('user_id', $user->id)->latest()->first();

        if (!$subscription || $subscription->plan === 'Free') {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'membership' => 'free',
                    'expires_at' => null,
                    'remaining_uploads' => 2 - ($player->monthly_video_count ?? 0)
                ]
            ]);
        }

        $expiresAt = $subscription->expires_at;
        $now = now();
        $daysRemaining = $expiresAt ? $now->diffInDays($expiresAt) : 0;

        return response()->json([
            'status' => 'success',
            'data' => [
                'membership' => $player->membership,
                'expires_at' => $expiresAt,
                'days_remaining' => $daysRemaining,
                'remaining_uploads' => 'unlimited'
            ]
        ]);
    }

    /**
     * Upgrade player membership
     */
    public function upgradePlayerMembership(Request $request)
    {
        $user = Auth::user();
        $player = $user->player;

        if (!$player) {
            return response()->json([
                'status' => 'error',
                'message' => 'Player not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'plan_type' => 'required|in:Player Monthly,Player Yearly',
            'card_number' => 'required|string|size:16',
            'cardholder_name' => 'required|string|max:255',
            'expiry' => 'required|string|size:5',
            'cvv' => 'required|string|size:3'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Validate card expiry
        if (!$this->isExpiryValid($request->expiry)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Card has expired'
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Get the plan
            $plan = Plan::where('name', $request->plan_type)->first();
            if (!$plan) {
                throw new \Exception('Selected plan not found');
            }

            // Create payment record
            $lastFour = substr($request->card_number, -4);
            $encryptedCard = Crypt::encryptString($request->card_number);
            $encryptedCVV = Crypt::encryptString($request->cvv);

            $payment = Payment::create([
                'user_id' => $user->id,
                'amount' => $plan->Price,
                'currency' => 'EGP',
                'payment_method' => 'card',
                'card_number_encrypted' => $encryptedCard,
                'card_last_four' => $lastFour,
                'expiry' => $request->expiry,
                'cvv_encrypted' => $encryptedCVV,
                'cardholder_name' => $request->cardholder_name,
                'status' => 'completed'
            ]);

            // Create or update subscription
            $subscription = Subscription::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'player_id' => $player->id,
                    'plan_id' => $plan->id,
                    'payment_id' => $payment->id,
                    'plan' => $plan->Name,
                    'active' => true,
                    'expires_at' => now()->addDays($plan->Duration),
                    'canceled_at' => null
                ]
            );

            // Update player membership and subscription fields
            $player->update([
                'membership' => 'premium',
                'subscription_id' => $subscription->id,
                'subscription_expires_at' => now()->addDays($plan->Duration)
            ]);

            // Create invoice
            $invoice = PlayerInvoice::create([
                'payment_id' => $payment->id,
                'player_id' => $player->id,
                'invoice_number' => 'INV-' . date('Y') . '-' . str_pad($payment->id, 6, '0', STR_PAD_LEFT),
                'amount' => $plan->Price,
                'currency' => 'EGP',
                'status' => 'paid',
                'paid_at' => now()
            ]);

            // Send invoice email
            try {
                Mail::to($user->email)->send(new PlayerSubscriptionInvoice([
                    'player_name' => $user->first_name . ' ' . $user->last_name,
                    'plan_name' => $plan->Name,
                    'amount' => $plan->Price,
                    'invoice_number' => $invoice->invoice_number,
                    'invoice_date' => $invoice->created_at->format('F j, Y'),
                    'card_last_four' => $lastFour,
                    'expiry_date' => $subscription->expires_at->format('F j, Y')
                ]));
            } catch (\Exception $e) {
                Log::error('Failed to send player invoice email: ' . $e->getMessage());
                // Don't return error to user as subscription was successful
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Membership upgraded successfully',
                'data' => [
                    'subscription' => $subscription,
                    'payment_id' => $payment->id,
                    'card_last_four' => $lastFour,
                    'invoice_number' => $invoice->invoice_number
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Player membership upgrade failed: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to upgrade membership: ' . $e->getMessage()
            ], 500);
        }
    }
    public function manageSubscription()
{
    $user = auth()->user();
    $player = $user->player; 

    if (!$player || !$user->subscription) {
        return response()->json([
            'status' => 'success',
            'data' => null
        ]);
    }

    $subscription = $user->subscription;

    $expiresAt = Carbon::parse($subscription->expires_at);
    $now = Carbon::now();

    $totalMinutes = $now->diffInMinutes($expiresAt, false);

    $daysLeft = intdiv($totalMinutes, 1440);
    $hoursLeft = intdiv($totalMinutes % 1440, 60);

    $daysLeft = max($daysLeft, 0);
    $hoursLeft = max($hoursLeft, 0);
    if($subscription->active==1){
        $status="Active";
    }elseif($subscription->active==0){
        $status="Deactivated";

    }


    return response()->json([
        'status' => 'success',
        'data' => [
            'plan' => $subscription->plan,
            'plan_type' => Str::contains(strtolower($subscription->plan), 'monthly') ? 'monthly' : 'yearly',
            'expires_at' => $expiresAt->toDateString(),
            'days_left' => $daysLeft,
            'hours_left' => $hoursLeft,
            'created_at' => $subscription->created_at->toDateTimeString(),
            'status'=>$status,

        ]
    ]);
}

  
}
