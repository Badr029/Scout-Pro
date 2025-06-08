<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Admin;

class AdminAuth
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if user is authenticated with Sanctum
        if (!$request->user()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated'
            ], 401);
        }

        // Check if authenticated user is an admin
        if (!$request->user() instanceof Admin) {
            return response()->json([
                'status' => 'error',
                'message' => 'Access denied. Admin privileges required.'
            ], 403);
        }

        // Check if admin is active
        if (!$request->user()->is_active) {
            return response()->json([
                'status' => 'error',
                'message' => 'Admin account is deactivated'
            ], 403);
        }

        return $next($request);
    }
}
