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
}
