<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Schema;

class AccountController extends Controller
{
    /**
     * Delete the user's account.
     */
    public function delete(Request $request)
    {
        $user = Auth::user();

        // Different validation based on account type
        if ($user->provider === 'GOOGLE') {
            $validator = Validator::make($request->all(), [
                'confirm_delete' => 'required|string|in:delete',
            ]);
        } else {
            $validator = Validator::make($request->all(), [
                'password' => 'required|string',
            ]);
        }

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        // For regular accounts, verify password
        if ($user->provider !== 'GOOGLE' && !Hash::check($request->password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Password is incorrect'
            ], 401);
        }

        // Check if videos table exists before attempting to delete user videos
        if (method_exists($user, 'videos') && Schema::hasTable('videos')) {
            $user->videos()->delete();
        }

        // Check if subscription table exists before attempting to delete
        if (method_exists($user, 'subscription') && Schema::hasTable('subscriptions') && $user->subscription) {
            $user->subscription->delete();
        }

        // Check if comments table exists before attempting to delete
        if (method_exists($user, 'comments') && Schema::hasTable('comments')) {
            $user->comments()->delete();
        }

        // Check if likes table exists before attempting to delete
        if (method_exists($user, 'likes') && Schema::hasTable('likes')) {
            $user->likes()->delete();
        }

        // Check if followers table exists before attempting to detach
        if (method_exists($user, 'followers') && Schema::hasTable('followers')) {
            $user->followers()->detach();
            $user->following()->detach();
        }

        // Delete the user
        $user->delete();

        // Revoke all tokens
        $user->tokens()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Account deleted successfully'
        ]);
    }
}
