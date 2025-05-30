<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Scout;
use App\Models\Player;
use App\Models\Follow;

class ScoutController extends Controller
{
    /**
     * Get the list of players contacted by the scout
     */
    public function getContactedPlayers()
    {
        $user = Auth::user();

        if ($user->user_type !== 'scout') {
            return response()->json(['error' => 'Unauthorized: Only scouts can access this endpoint.'], 403);
        }

        // Get players that the scout has followed/contacted
        $contactedPlayers = Follow::where('follower_id', $user->id)
            ->with(['following' => function ($query) {
                $query->with('player');
            }])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($follow) {
                $player = $follow->following->player;
                return [
                    'id' => $player->id,
                    'player_name' => $follow->following->first_name . ' ' . $follow->following->last_name,
                    'contact_date' => $follow->created_at->format('Y-m-d'),
                    'status' => $this->determineContactStatus($follow),
                    'player_profile_url' => '/player/' . $player->id
                ];
            });

        return response()->json([
            'message' => 'Contacted players fetched successfully.',
            'data' => $contactedPlayers
        ]);
    }

    /**
     * Determine the contact status based on interaction history
     */
    private function determineContactStatus($follow)
    {
        // This is a placeholder logic. You can enhance this based on your requirements
        $daysSinceContact = now()->diffInDays($follow->created_at);

        if ($daysSinceContact > 30) {
            return 'idle';
        } elseif ($daysSinceContact > 7) {
            return 'contacted';
        } else {
            return 'in_discussion';
        }
    }
}
