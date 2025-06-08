<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\Admin;

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

            // Check if the authenticated user is an Admin (from admins table)
            if (!($user instanceof Admin)) {
                Log::warning('Unauthorized admin access attempt - not an admin user', [
                    'user_id' => $user->id,
                    'user_class' => get_class($user),
                    'ip' => $request->ip(),
                    'path' => $request->path()
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized. Admin access required.'
                ], 403);
            }

            // Check if admin is active
            if (!$user->is_active) {
                Log::warning('Inactive admin access attempt', [
                    'admin_id' => $user->id,
                    'ip' => $request->ip(),
                    'path' => $request->path()
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Admin account is deactivated.'
                ], 403);
            }

            Log::info('Admin access granted', [
                'admin_id' => $user->id,
                'admin_role' => $user->role,
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
