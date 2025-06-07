<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Follow;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Traits\NotificationHelper;

class PlayerController extends Controller
{
    use NotificationHelper;

    /**
     * Follow a user.
     * @param int $userId
     */
    public function follow(int $userId)
    {
        try {
            $follower = Auth::user();
            $following = User::findOrFail($userId);

            // Prevent self-following
            if ($follower->id === $following->id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You cannot follow yourself'
                ], 400);
            }

            // Check if already following
            $existingFollow = Follow::where('follower_id', $follower->id)
                ->where('following_id', $following->id)
                ->first();

            if ($existingFollow) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Already following this user'
                ], 400);
            }

            // Create new follow relationship
            Follow::create([
                'follower_id' => $follower->id,
                'following_id' => $following->id
            ]);

            // Create notification for the user being followed
            $this->createFollowNotification($follower, $following);

            return response()->json([
                'status' => 'success',
                'message' => 'Successfully followed user',
                'following' => true
            ]);
        } catch (\Exception $e) {
            Log::error('Follow error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to follow user'
            ], 500);
        }
    }

    /**
     * Unfollow a user.
     * @param int $userId
     */
    public function unfollow(int $userId)
    {
        try {
            $follower = Auth::user();
            $following = User::findOrFail($userId);

            $follow = Follow::where('follower_id', $follower->id)
                ->where('following_id', $following->id)
                ->first();

            if (!$follow) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Not following this user'
                ], 400);
            }

            $follow->delete();

            // Delete any existing follow notifications
            Notification::where('user_id', $following->id)
                ->where('actor_id', $follower->id)
                ->where('type', 'follow')
                ->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Successfully unfollowed user',
                'following' => false
            ]);
        } catch (\Exception $e) {
            Log::error('Unfollow error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to unfollow user'
            ], 500);
        }
    }

    /**
     * Get follow status for a user.
     * @param int $userId
     */
    public function getFollowStatus(int $userId)
    {
        try {
            $follower = Auth::user();
            $following = User::findOrFail($userId);

            $isFollowing = Follow::where('follower_id', $follower->id)
                ->where('following_id', $following->id)
                ->exists();

        return response()->json([
            'status' => 'success',
                'following' => $isFollowing
            ]);
        } catch (\Exception $e) {
            Log::error('Get follow status error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to get follow status'
            ], 500);
        }
    }

    /**
     * Get trending players
     */
    public function getTrendingPlayers()
    {
        // Get players with most video views in the last 30 days
        $trendingPlayers = User::whereHas('player')
            ->whereHas('videos', function($query) {
                $query->where('created_at', '>=', now()->subDays(30));
            })
            ->withSum(['videos' => function($query) {
                $query->where('created_at', '>=', now()->subDays(30));
            }], 'views')
            ->with('player')
            ->orderByDesc('videos_sum_views')
            ->take(5)
            ->get()
            ->map(function($user) {
                $player = $user->player;
                return [
                    'id' => $user->id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'profile_image' => $player && $player->profile_image ? url('storage/' . $player->profile_image) : null,
                    'position' => $player ? $player->position : 'No Position',
                    'region' => $player ? ($player->current_city ?? $player->nationality) : 'No Region',
                    'views' => $user->videos_sum_views ?? 0
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $trendingPlayers
        ]);
    }
}
