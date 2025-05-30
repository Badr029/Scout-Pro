<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PlayerController extends Controller
{
    /**
     * Follow a player.
     */
    public function follow(Request $request, $playerId)
    {
        $user = Auth::user();
        $player = User::findOrFail($playerId);

        // Check if player exists and is a player
        if ($player->user_type !== 'player') {
            return response()->json([
                'status' => 'error',
                'message' => 'User is not a player'
            ], 400);
        }

        // Check if already following
        if ($user->following()->where('followed_id', $playerId)->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'You are already following this player'
            ], 400);
        }

        // Add follow relationship
        $user->following()->attach($playerId);

        return response()->json([
            'status' => 'success',
            'message' => 'Player followed successfully'
        ]);
    }

    /**
     * Unfollow a player.
     */
    public function unfollow(Request $request, $playerId)
    {
        $user = Auth::user();

        // Remove follow relationship
        $user->following()->detach($playerId);

        return response()->json([
            'status' => 'success',
            'message' => 'Player unfollowed successfully'
        ]);
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
