<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
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
        try {
            $user = Auth::user();

            if ($user->user_type !== 'scout') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $contactedPlayers = ContactRequest::where('scout_id', $user->id)
                ->with(['player.user'])
                ->get()
                ->map(function ($contact) {
                    $player = $contact->player;
                    return [
                        'id' => $player->id,
                        'user_id' => $player->user_id,
                        'first_name' => $player->first_name,
                        'last_name' => $player->last_name,
                        'profile_image' => $player->profile_image,
                        'position' => $player->position,
                        'nationality' => $player->nationality,
                        'current_city' => $player->current_city,
                        'membership' => $player->membership ?? 'free',
                        'contact_date' => $contact->created_at->format('Y-m-d'),
                        'contact_status' => $contact->status,
                        'responded_at' => $contact->responded_at ? $contact->responded_at->format('Y-m-d') : null,
                    ];
                });

            return response()->json([
                'message' => 'Contacted players retrieved successfully',
                'data' => $contactedPlayers
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to retrieve contacted players'], 500);
        }
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

    public function updateProfile(Request $request)
    {
        try {
            $user = Auth::user();

            if ($user->user_type !== 'scout') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $scout = $user->scout;
            if (!$scout) {
                return response()->json(['message' => 'Scout profile not found'], 404);
            }

            // Validate the request data
            $validator = Validator::make($request->all(), [
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'city' => 'required|string|max:255',
                'country' => 'required|string|max:255',
                'contact_email' => 'required|email|max:255',
                'contact_phone' => 'required|string|max:20',
                'organization' => 'required|string|max:255',
                'position_title' => 'required|string|max:255',
                'scouting_regions' => 'required|string', // JSON string
                'age_groups' => 'required|string', // JSON string
                'preferred_roles' => 'required|string', // JSON string
                'clubs_worked_with' => 'required|string|max:1000',
                'linkedin_url' => 'nullable|url|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $validatedData = $validator->validated();

            // Update user model (first name and last name)
            User::where('id', $user->id)->update([
                'first_name' => $validatedData['first_name'],
                'last_name' => $validatedData['last_name']
            ]);

            // Decode JSON fields
            $scoutingRegions = json_decode($validatedData['scouting_regions'], true);
            $ageGroups = json_decode($validatedData['age_groups'], true);
            $preferredRoles = json_decode($validatedData['preferred_roles'], true);

            // Validate decoded JSON
            if (!is_array($scoutingRegions) || !is_array($ageGroups) || !is_array($preferredRoles)) {
                return response()->json([
                    'message' => 'Invalid JSON format for array fields'
                ], 422);
            }

            // Update scout model
            $scout->update([
                'first_name' => $validatedData['first_name'],
                'last_name' => $validatedData['last_name'],
                'city' => $validatedData['city'],
                'country' => $validatedData['country'],
                'contact_email' => $validatedData['contact_email'],
                'contact_phone' => $validatedData['contact_phone'],
                'organization' => $validatedData['organization'],
                'position_title' => $validatedData['position_title'],
                'scouting_regions' => $scoutingRegions,
                'age_groups' => $ageGroups,
                'preferred_roles' => $preferredRoles,
                'clubs_worked_with' => $validatedData['clubs_worked_with'],
                'linkedin_url' => $validatedData['linkedin_url'],
            ]);

            // Refresh the scout model to get updated data
            $scout->refresh();

            return response()->json([
                'message' => 'Scout profile updated successfully',
                'data' => [
                    'scout' => $scout,
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Scout profile update error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update scout profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateProfileImage(Request $request)
    {
        try {
            $user = Auth::user();

            if ($user->user_type !== 'scout') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $scout = $user->scout;
            if (!$scout) {
                return response()->json(['message' => 'Scout profile not found'], 404);
            }

            // Validate the uploaded file
            $validator = Validator::make($request->all(), [
                'profile_image' => 'required|image|mimes:jpeg,png,jpg|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Delete old profile image if it exists
            if ($scout->profile_image && Storage::disk('public')->exists($scout->profile_image)) {
                Storage::disk('public')->delete($scout->profile_image);
            }

            // Store new profile image
            $profileImagePath = $request->file('profile_image')->store('scouts/profile_image', 'public');

            // Update scout profile
            $scout->update([
                'profile_image' => $profileImagePath
            ]);

            return response()->json([
                'message' => 'Profile image updated successfully',
                'data' => [
                    'profile_image' => $profileImagePath
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Scout profile image update error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update profile image',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
