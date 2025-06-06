<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Subscription;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class StatisticsController extends Controller
{
    public function getPaymentStats(): JsonResponse
    {
        try {
            Log::info('Starting payment stats calculation');

            $now = Carbon::now();
            $startOfMonth = $now->copy()->startOfMonth();
            $startOfLastMonth = $now->copy()->subMonth()->startOfMonth();
            $endOfLastMonth = $now->copy()->subMonth()->endOfMonth();

            // Calculate total revenue
            $totalRevenue = Payment::sum('amount');
            Log::info('Total revenue calculated: ' . $totalRevenue);

            // Calculate monthly revenue
            $monthlyRevenue = Payment::where('created_at', '>=', $startOfMonth)
                ->where('created_at', '<=', $now)
                ->sum('amount');

            $lastMonthRevenue = Payment::whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])
                ->sum('amount');

            Log::info('Monthly revenue calculated: ' . $monthlyRevenue);
            Log::info('Last month revenue calculated: ' . $lastMonthRevenue);

            // Calculate revenue growth
            $revenueGrowth = $lastMonthRevenue > 0
                ? (($monthlyRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100
                : ($monthlyRevenue > 0 ? 100 : 0);

            // Calculate total transactions
            $totalTransactions = Payment::count();
            Log::info('Total transactions: ' . $totalTransactions);

            // Calculate average transaction
            $averageTransaction = $totalTransactions > 0 ? $totalRevenue / $totalTransactions : 0;

            // Calculate monthly growth
            $monthlyGrowth = $lastMonthRevenue > 0
                ? (($monthlyRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100
                : ($monthlyRevenue > 0 ? 100 : 0);

            // Get monthly transactions for the chart
            $startDate = $now->copy()->subMonths(11)->startOfMonth();
            $monthlyTransactions = Payment::where('created_at', '>=', $startDate)
                ->get()
                ->groupBy(function($payment) {
                    return Carbon::parse($payment->created_at)->format('Y-m');
                })
                ->map(function($payments, $month) {
                    return [
                        'month' => $month,
                        'revenue' => round($payments->sum('amount'), 2),
                        'count' => $payments->count()
                    ];
                })
                ->values();

            Log::info('Monthly transactions calculated', ['count' => $monthlyTransactions->count()]);

            $response = [
                'status' => 'success',
                'data' => [
                    'totalRevenue' => round($totalRevenue, 2),
                    'monthlyRevenue' => round($monthlyRevenue, 2),
                    'averageTransaction' => round($averageTransaction, 2),
                    'totalTransactions' => $totalTransactions,
                    'revenueGrowth' => round($revenueGrowth, 2),
                    'monthlyGrowth' => round($monthlyGrowth, 2),
                    'monthlyTransactions' => $monthlyTransactions
                ]
            ];

            Log::info('Payment stats response prepared', ['response' => $response]);
            return response()->json($response);

        } catch (\Exception $e) {
            Log::error('Error in getPaymentStats: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'status' => 'error',
                'message' => 'Error calculating payment statistics',
                'debug_message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    public function getSubscriptionStats(): JsonResponse
    {
        try {
            Log::info('Starting subscription stats calculation');

            $now = Carbon::now();
            $startOfMonth = $now->copy()->startOfMonth();
            $endOfMonth = $now->copy()->endOfMonth();
            $sevenDaysFromNow = $now->copy()->addDays(7);

            // Calculate total subscriptions
            $totalSubscriptions = Subscription::count();
            Log::info('Total subscriptions: ' . $totalSubscriptions);

            // Calculate active subscriptions
            $activeSubscriptions = Subscription::where('active', true)
                ->where('expires_at', '>', $now)
                ->count();
            Log::info('Active subscriptions: ' . $activeSubscriptions);

            // Calculate expired subscriptions
            $expiredSubscriptions = Subscription::where(function ($query) use ($now) {
                $query->where('active', false)
                    ->orWhere('expires_at', '<=', $now);
            })->count();

            // Calculate upcoming renewals
            $upcomingRenewals = Subscription::where('active', true)
                ->whereBetween('expires_at', [$now, $sevenDaysFromNow])
                ->count();

            // Get next renewals with eager loading
            $nextRenewals = Subscription::with('user:id,first_name,last_name')
                ->where('active', true)
                ->where('expires_at', '>', $now)
                ->orderBy('expires_at')
                ->limit(5)
                ->get()
                ->map(function ($subscription) {
                    return [
                        'user' => $subscription->user->first_name . ' ' . $subscription->user->last_name,
                        'expires_at' => $subscription->expires_at->format('Y-m-d H:i:s')
                    ];
                });

            // Calculate retention rate
            $totalEndedSubscriptions = Subscription::where('expires_at', '<', $now)->count();
            $renewedSubscriptions = Subscription::where('expires_at', '<', $now)
                ->where('active', true)
                ->count();
            $retentionRate = $totalEndedSubscriptions > 0
                ? ($renewedSubscriptions / $totalEndedSubscriptions) * 100
                : 0;

            // Calculate new and churned subscriptions
            $newSubscriptions = Subscription::where('created_at', '>=', $startOfMonth)
                ->where('created_at', '<=', $endOfMonth)
                ->count();

            $churnedSubscriptions = Subscription::where('expires_at', '>=', $startOfMonth)
                ->where('expires_at', '<=', $endOfMonth)
                ->where('active', false)
                ->count();

            $response = [
                'status' => 'success',
                'data' => [
                    'totalSubscriptions' => $totalSubscriptions,
                    'activeSubscriptions' => $activeSubscriptions,
                    'expiredSubscriptions' => $expiredSubscriptions,
                    'upcomingRenewals' => $upcomingRenewals,
                    'nextRenewals' => $nextRenewals,
                    'retentionRate' => round($retentionRate, 2),
                    'newSubscriptions' => $newSubscriptions,
                    'churnedSubscriptions' => $churnedSubscriptions
                ]
            ];

            Log::info('Subscription stats response prepared', ['response' => $response]);
            return response()->json($response);

        } catch (\Exception $e) {
            Log::error('Error in getSubscriptionStats: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'status' => 'error',
                'message' => 'Error calculating subscription statistics',
                'debug_message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}
