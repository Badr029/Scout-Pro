<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Player;
use App\Models\Scout;
use App\Models\Plan;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\Invoice;
use App\Models\PlayerInvoice;
use Illuminate\Support\Facades\Crypt;
use Carbon\Carbon;

class SubscriptionPaymentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Sample card data for testing
        $sampleCards = [
            [
                'card_number' => '4111111111111111',
                'cardholder_name' => 'Ahmed Hassan Mohamed',
                'expiry' => '12/26',
                'cvv' => '123'
            ],
            [
                'card_number' => '4222222222222222',
                'cardholder_name' => 'Omar Gaber Ali',
                'expiry' => '11/25',
                'cvv' => '456'
            ],
            [
                'card_number' => '4333333333333333',
                'cardholder_name' => 'Karim Hafez Ibrahim',
                'expiry' => '10/27',
                'cvv' => '789'
            ],
            [
                'card_number' => '4444444444444444',
                'cardholder_name' => 'Abdulrahman Ahmed',
                'expiry' => '09/26',
                'cvv' => '321'
            ],
            [
                'card_number' => '4555555555555555',
                'cardholder_name' => 'Khaled Mostafa',
                'expiry' => '08/25',
                'cvv' => '654'
            ]
        ];

        $cardIndex = 0;

        // Get plans
        $playerMonthlyPlan = Plan::where('Name', 'Player Monthly')->first();
        $playerYearlyPlan = Plan::where('Name', 'Player Yearly')->first();
        $scoutMonthlyPlan = Plan::where('Name', 'Scout Monthly')->first();
        $scoutYearlyPlan = Plan::where('Name', 'Scout Yearly')->first();

        // Process Players with Premium Membership
        $premiumPlayers = Player::where('membership', 'premium')->get();

        foreach ($premiumPlayers as $player) {
            $user = $player->user;
            $card = $sampleCards[$cardIndex % count($sampleCards)];
            $cardIndex++;

            // Randomly choose between monthly and yearly plan
            $plan = rand(0, 1) ? $playerMonthlyPlan : $playerYearlyPlan;

            // Calculate subscription dates (some recent, some older)
            $subscriptionStart = Carbon::now()->subDays(rand(30, 180));
            $subscriptionExpiry = $subscriptionStart->copy()->addDays($plan->Duration);

            // Create payment record
            $payment = Payment::create([
                'user_id' => $user->id,
                'amount' => $plan->Price,
                'card_number_encrypted' => Crypt::encryptString($card['card_number']),
                'card_last_four' => substr($card['card_number'], -4),
                'expiry' => $card['expiry'],
                'cvv_encrypted' => Crypt::encryptString($card['cvv']),
                'cardholder_name' => $card['cardholder_name'],
                'created_at' => $subscriptionStart,
                'updated_at' => $subscriptionStart,
            ]);

            // Create subscription
            $subscription = Subscription::create([
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'payment_id' => $payment->id,
                'active' => $subscriptionExpiry->isFuture(),
                'plan' => $plan->Name,
                'trial_ends_at' => null,
                'expires_at' => $subscriptionExpiry,
                'canceled_at' => null,
                'created_at' => $subscriptionStart,
                'updated_at' => $subscriptionStart,
            ]);

            // Update player subscription fields
            $player->update([
                'subscription_id' => $subscription->id,
                'subscription_expires_at' => $subscriptionExpiry,
            ]);

            // Create regular invoice
            $invoice = Invoice::create([
                'payment_id' => $payment->id,
                'IssueDate' => $subscriptionStart,
                'Status' => 'Paid',
                'created_at' => $subscriptionStart,
                'updated_at' => $subscriptionStart,
            ]);

            // Create player invoice
            $playerInvoice = PlayerInvoice::create([
                'payment_id' => $payment->id,
                'player_id' => $player->id,
                'invoice_number' => 'PLY-' . date('Y', strtotime($subscriptionStart)) . '-' . str_pad($payment->id, 6, '0', STR_PAD_LEFT),
                'amount' => $plan->Price,
                'currency' => 'EGP',
                'status' => 'paid',
                'paid_at' => $subscriptionStart,
                'created_at' => $subscriptionStart,
                'updated_at' => $subscriptionStart,
            ]);

            echo "Created subscription for player: " . $user->first_name . " " . $user->last_name . " (" . $plan->Name . ")\n";
        }

        // Process Scouts with Active Subscriptions
        $activeScouts = Scout::where('subscription_active', true)->get();

        foreach ($activeScouts as $scout) {
            $user = $scout->user;
            $card = $sampleCards[$cardIndex % count($sampleCards)];
            $cardIndex++;

            // Randomly choose between monthly and yearly plan
            $plan = rand(0, 1) ? $scoutMonthlyPlan : $scoutYearlyPlan;

            // Calculate subscription dates based on scout's expires_at or create new dates
            if ($scout->subscription_expires_at && $scout->subscription_expires_at->isFuture()) {
                $subscriptionExpiry = $scout->subscription_expires_at;
                $subscriptionStart = $subscriptionExpiry->copy()->subDays($plan->Duration);
            } else {
                $subscriptionStart = Carbon::now()->subDays(rand(30, 180));
                $subscriptionExpiry = $subscriptionStart->copy()->addDays($plan->Duration);

                // Update scout expiry date
                $scout->update([
                    'subscription_expires_at' => $subscriptionExpiry
                ]);
            }

            // Create payment record
            $payment = Payment::create([
                'user_id' => $user->id,
                'amount' => $plan->Price,
                'card_number_encrypted' => Crypt::encryptString($card['card_number']),
                'card_last_four' => substr($card['card_number'], -4),
                'expiry' => $card['expiry'],
                'cvv_encrypted' => Crypt::encryptString($card['cvv']),
                'cardholder_name' => $card['cardholder_name'],
                'created_at' => $subscriptionStart,
                'updated_at' => $subscriptionStart,
            ]);

            // Create subscription
            $subscription = Subscription::create([
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'payment_id' => $payment->id,
                'active' => $subscriptionExpiry->isFuture(),
                'plan' => $plan->Name,
                'trial_ends_at' => null,
                'expires_at' => $subscriptionExpiry,
                'canceled_at' => null,
                'created_at' => $subscriptionStart,
                'updated_at' => $subscriptionStart,
            ]);

            // Update scout subscription fields
            $scout->update([
                'subscription_id' => $subscription->id,
                'subscription_expires_at' => $subscriptionExpiry,
            ]);

            // Create invoice
            $invoice = Invoice::create([
                'payment_id' => $payment->id,
                'IssueDate' => $subscriptionStart,
                'Status' => 'Paid',
                'created_at' => $subscriptionStart,
                'updated_at' => $subscriptionStart,
            ]);

            echo "Created subscription for scout: " . $user->first_name . " " . $user->last_name . " (" . $plan->Name . ")\n";
        }

        // Create some expired subscriptions for testing
        $this->createExpiredSubscriptions($sampleCards);
    }

    /**
     * Create some expired subscriptions for testing purposes
     */
    private function createExpiredSubscriptions($sampleCards)
    {
        // Get a few free players and scouts to give them expired subscriptions
        $freePlayers = Player::where('membership', 'free')->take(2)->get();
        $inactiveScouts = Scout::where('subscription_active', false)->take(1)->get();

        $playerMonthlyPlan = Plan::where('Name', 'Player Monthly')->first();
        $scoutMonthlyPlan = Plan::where('Name', 'Scout Monthly')->first();

        // Create expired player subscriptions
        foreach ($freePlayers as $player) {
            $user = $player->user;
            $card = $sampleCards[array_rand($sampleCards)];

            $subscriptionStart = Carbon::now()->subDays(rand(60, 120));
            $subscriptionExpiry = $subscriptionStart->copy()->addDays(30); // 30 days expired

            $payment = Payment::create([
                'user_id' => $user->id,
                'amount' => $playerMonthlyPlan->Price,
                'card_number_encrypted' => Crypt::encryptString($card['card_number']),
                'card_last_four' => substr($card['card_number'], -4),
                'expiry' => $card['expiry'],
                'cvv_encrypted' => Crypt::encryptString($card['cvv']),
                'cardholder_name' => $card['cardholder_name'],
                'created_at' => $subscriptionStart,
                'updated_at' => $subscriptionStart,
            ]);

            $subscription = Subscription::create([
                'user_id' => $user->id,
                'plan_id' => $playerMonthlyPlan->id,
                'payment_id' => $payment->id,
                'active' => false,
                'plan' => 'Free', // Reverted to free
                'trial_ends_at' => null,
                'expires_at' => $subscriptionExpiry,
                'canceled_at' => null,
                'created_at' => $subscriptionStart,
                'updated_at' => $subscriptionStart,
            ]);

            $invoice = Invoice::create([
                'payment_id' => $payment->id,
                'IssueDate' => $subscriptionStart,
                'Status' => 'Paid',
                'created_at' => $subscriptionStart,
                'updated_at' => $subscriptionStart,
            ]);

            $playerInvoice = PlayerInvoice::create([
                'payment_id' => $payment->id,
                'player_id' => $player->id,
                'invoice_number' => 'PLY-' . date('Y', strtotime($subscriptionStart)) . '-' . str_pad($payment->id, 6, '0', STR_PAD_LEFT),
                'amount' => $playerMonthlyPlan->Price,
                'currency' => 'EGP',
                'status' => 'paid',
                'paid_at' => $subscriptionStart,
                'created_at' => $subscriptionStart,
                'updated_at' => $subscriptionStart,
            ]);

            echo "Created expired subscription for player: " . $user->first_name . " " . $user->last_name . "\n";
        }

        // Create expired scout subscriptions
        foreach ($inactiveScouts as $scout) {
            $user = $scout->user;
            $card = $sampleCards[array_rand($sampleCards)];

            $subscriptionStart = Carbon::now()->subDays(rand(60, 120));
            $subscriptionExpiry = $subscriptionStart->copy()->addDays(30); // 30 days expired

            $payment = Payment::create([
                'user_id' => $user->id,
                'amount' => $scoutMonthlyPlan->Price,
                'card_number_encrypted' => Crypt::encryptString($card['card_number']),
                'card_last_four' => substr($card['card_number'], -4),
                'expiry' => $card['expiry'],
                'cvv_encrypted' => Crypt::encryptString($card['cvv']),
                'cardholder_name' => $card['cardholder_name'],
                'created_at' => $subscriptionStart,
                'updated_at' => $subscriptionStart,
            ]);

            $subscription = Subscription::create([
                'user_id' => $user->id,
                'plan_id' => $scoutMonthlyPlan->id,
                'payment_id' => $payment->id,
                'active' => false,
                'plan' => $scoutMonthlyPlan->Name,
                'trial_ends_at' => null,
                'expires_at' => $subscriptionExpiry,
                'canceled_at' => null,
                'created_at' => $subscriptionStart,
                'updated_at' => $subscriptionStart,
            ]);

            $invoice = Invoice::create([
                'payment_id' => $payment->id,
                'IssueDate' => $subscriptionStart,
                'Status' => 'Paid',
                'created_at' => $subscriptionStart,
                'updated_at' => $subscriptionStart,
            ]);

            // Update scout to reflect expired subscription
            $scout->update([
                'subscription_id' => $subscription->id,
                'subscription_expires_at' => $subscriptionExpiry,
            ]);

            echo "Created expired subscription for scout: " . $user->first_name . " " . $user->last_name . "\n";
        }
    }
}
