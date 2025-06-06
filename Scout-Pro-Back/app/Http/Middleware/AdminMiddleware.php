<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        try {
            if (!Auth::check()) {
                Log::warning('Unauthorized access attempt: User not authenticated', [
                    'ip' => $request->ip(),
                    'path' => $request->path()
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized. Please login first.'
                ], 401);
            }

            $user = Auth::user();
            if ($user->user_type !== 'admin') {
                Log::warning('Unauthorized admin access attempt', [
                    'user_id' => $user->id,
                    'user_type' => $user->user_type,
                    'ip' => $request->ip(),
                    'path' => $request->path()
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized. Admin access required.'
                ], 403);
        }

            Log::info('Admin access granted', [
                'user_id' => $user->id,
                'path' => $request->path()
            ]);

            return $next($request);
        } catch (\Exception $e) {
            Log::error('Error in AdminMiddleware: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'Internal server error',
                'debug_message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}
