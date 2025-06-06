<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Arr;
use App\Models\Scout;
use App\Models\Player;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = Auth::user();

        if ($user->user_type === 'player') {
            $player = $user->player;

            // Merge player data with user data
            $playerData = $player->toArray();
            $userData = [
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'username' => $user->username,
                'email' => $user->email,
                'user_type' => $user->user_type,
                'user_id' => $user->id,
                'provider' => $user->provider
            ];
            $profileData = array_merge($playerData, $userData);

            return response()->json([
                'message' => 'Player profile fetched successfully.',
                'data' => $profileData,
            ], 200);
        }
        elseif ($user->user_type === 'scout') {
            $scout = $user->scout;

            if (!$scout) {
                return response()->json([
                    'message' => 'Scout profile not found.',
                    'data' => null
                ], 404);
            }

            // Merge scout data with user data
            $scoutData = $scout->toArray();
            $userData = [
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'username' => $user->username,
                'email' => $user->email,
                'user_type' => $user->user_type,
                'user_id' => $user->id,
                'provider' => $user->provider
            ];
            $profileData = array_merge($scoutData, $userData);

            return response()->json([
                'message' => 'Scout profile fetched successfully.',
                'data' => $profileData,
            ], 200);
        }

        return response()->json(['message' => 'Invalid user type.'], 400);
    }

    public function update(Request $request)
    {
        $user = Auth::user();

        if ($user->user_type === 'player') {

            $player = $user->player;
            $validatedData = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'profile_image'      => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                'DateofBirth'        => 'required|date|before:today',
                'phone_number'       => 'required|string|max:15',
                'height'             => 'required|integer|min:100|max:250',
                'weight'             => 'required|integer|min:30|max:200',
                'preferred_foot'     => 'required|string|max:255',
                'position'           => 'required|string|max:255',
                'secondary_position' => 'nullable|json',
                'gender'             => 'required|in:male,female',
                'nationality'        => 'required|string|max:255',
                'current_city'       => 'required|string|max:255',
                'current_club'       => 'required|string|max:255',
                'previous_clubs'     => 'nullable|json',
                'playing_style'      => 'nullable|string|max:255',
                'transfer_status'    => 'nullable|string|max:255',
                'bio'                => 'nullable|string|max:1000',
            ]);

            // Update user model
            User::where('id', $user->id)->update([
                'first_name' => $validatedData['first_name'],
                'last_name' => $validatedData['last_name']
            ]);

            // Decode JSON fields before saving
            if (isset($validatedData['secondary_position']) && is_string($validatedData['secondary_position'])) {
                $validatedData['secondary_position'] = json_decode($validatedData['secondary_position'], true);
            }

            if (isset($validatedData['previous_clubs']) && is_string($validatedData['previous_clubs'])) {
                $validatedData['previous_clubs'] = json_decode($validatedData['previous_clubs'], true);
            }

            foreach ($validatedData as $key => $value) {
                $player->$key = $value;
            }
            $player->save();

            return response()->json([
                'message' => 'Player profile updated successfully.',
                'data' => [
                    'player' => $player,
                ]
            ], 200);
        }
        elseif ($user->user_type === 'scout') {
            $scout = $user->scout;
            $validatedData = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'profile_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                'city' => 'required|string|max:255',
                'country' => 'required|string|max:255',
                'contact_email' => 'required|email|max:255',
                'contact_phone' => 'required|string|max:20',
                'organization' => 'required|string|max:255',
                'position_title' => 'required|string|max:255',
                'scouting_regions' => 'required|json',
                'age_groups' => 'required|json',
                'preferred_roles' => 'required|json',
                'clubs_worked_with' => 'required|string|max:1000',
                'linkedin_url' => 'nullable|url|max:255',
            ]);

            // Update user model
            User::where('id', $user->id)->update([
                'first_name' => $validatedData['first_name'],
                'last_name' => $validatedData['last_name']
            ]);

            // Handle profile image upload
            if ($request->hasFile('profile_image')) {
                if ($scout->profile_image) {
                    Storage::disk('public')->delete($scout->profile_image);
                }
                $validatedData['profile_image'] = $request->file('profile_image')->store('scouts/profile_image', 'public');
            }

            // Decode JSON fields
            $validatedData['scouting_regions'] = json_decode($validatedData['scouting_regions'], true);
            $validatedData['age_groups'] = json_decode($validatedData['age_groups'], true);
            $validatedData['preferred_roles'] = json_decode($validatedData['preferred_roles'], true);

            // Update scout model
            foreach ($validatedData as $key => $value) {
                $scout->$key = $value;
            }
            $scout->save();

            return response()->json([
                'message' => 'Scout profile updated successfully.',
                'data' => [
                    'scout' => $scout,
                ]
            ], 200);
        } else {
            return response()->json(['message' => 'Invalid user type.'], 400);
        }
    }

    public function delete(Request $request) {
        $user = Auth::user();

        // Check if user is a Google account
        if ($user->provider === 'GOOGLE') {
            // For Google accounts, validate the confirmation text
            $request->validate([
                'confirm_delete' => 'required|string|in:delete',
            ]);

            if ($user->user_type == 'player') {
                $user->player()->delete();
                $user->delete();
                return response()->json(['message' => 'Player account deactivated permanently'], 200);
            }

            if ($user->user_type == 'scout') {
                $user->scout()->delete();
                $user->delete();
                return response()->json(['message' => 'Scout account deactivated permanently'], 200);
            }
        } else {
            // Regular email account - validate password
            $request->validate([
                'password' => 'required|string',
            ]);

            if (!Hash::check($request->password, $user->password)) {
                return response()->json(['message' => 'Incorrect password'], 403);
            }

            if ($user->user_type == 'player') {
                $user->player()->delete();
                $user->delete();
                return response()->json(['message' => 'Player account deactivated permanently'], 200);
            }

            if ($user->user_type == 'scout') {
                $user->scout()->delete();
                $user->delete();
                return response()->json(['message' => 'Scout account deactivated permanently'], 200);
            }
        }

        return response()->json(['message' => 'Invalid user type'], 400);
    }
}

