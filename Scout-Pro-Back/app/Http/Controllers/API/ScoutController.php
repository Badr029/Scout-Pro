<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Scout;
use App\Models\Player;
use App\Models\Follow;
use App\Models\ContactRequest;
use App\Models\User;

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

        // Get contact requests made by the scout
        $contactRequests = ContactRequest::where('scout_id', $user->id)
            ->with(['player.player', 'player']) // Load the user and their player profile
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($request) {
                $player = $request->player;
                $playerProfile = $player->player;
                return [
                    'id' => $player->id, // This is the user_id we need for navigation
                    'first_name' => $player->first_name,
                    'last_name' => $player->last_name,
                    'profile_image' => $playerProfile->profile_image,
                    'position' => $playerProfile->position,
                    'nationality' => $playerProfile->nationality,
                    'current_city' => $playerProfile->current_city,
                    'membership' => $player->membership,
                    'type' => 'player',
                    'contact_date' => $request->created_at->format('Y-m-d'),
                    'contact_status' => $request->status,
                    'responded_at' => $request->responded_at ? $request->responded_at->format('Y-m-d') : null
                ];
            });

        return response()->json([
            'message' => 'Contacted players fetched successfully.',
            'data' => $contactRequests
        ]);
    }

    /**
     * Get contact request status for a specific player
     */
    public function getContactStatus($playerId)
    {
        $user = Auth::user();

        if ($user->user_type !== 'scout') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $contactRequest = ContactRequest::where('scout_id', $user->id)
            ->where('player_id', $playerId)
            ->first();

        return response()->json([
            'status' => 'success',
            'data' => [
                'has_request' => !is_null($contactRequest),
                'request_status' => $contactRequest ? $contactRequest->status : null,
                'responded_at' => $contactRequest && $contactRequest->responded_at ? $contactRequest->responded_at->format('Y-m-d') : null
            ]
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
