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
                'email' => $user->email
            ];
            $profileData = array_merge($playerData, $userData);

            return response()->json([
                'message' => 'Player profile fetched successfully.',
                'data' => $profileData,
            ], 200);
        }
        elseif ($user->user_type === 'scout') {
            $scout = $user->scout;

            // Merge scout data with user data
            $scoutData = $scout->toArray();
            $userData = [
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'username' => $user->username,
                'email' => $user->email
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
            $validated = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'profile_image'      => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                'city' => 'required|string|max:255',
                'country' => 'required|string|max:255',
                'contact_email' => 'required|email|max:255',
                'contact_phone' => 'required|string|max:20',

                // Organization and Role Information
                'organization' => 'required|string|max:255',
                'position_title' => 'required|string|max:255',
                // 'scouting_regions' => 'required|array|min:1',
                'scouting_regions' => 'required|string|max:255',
                'age_groups' => 'required|array|min:1',
                'age_groups.*' => 'required|string|max:50',
                // 'preferred_roles' => 'required|array|min:1',
                'preferred_roles' => 'required|string|max:255',
                'clubs_worked_with' => 'required|string|max:1000',

                // Professional Information
                'linkedin_url' => 'nullable|url|max:255',
                'id_proof' => 'required|file|mimes:pdf,jpeg,png,jpg|max:5120',
                'certifications' => 'required|array|min:1',
                'certifications.*' => 'required|file|mimes:pdf,jpeg,png,jpg|max:5120',
            ]);

            // Handle uploads
            if ($request->hasFile('profile_image')) {
                $validatedData['profile_image'] = $request->file('profile_image')->store('profile_images', 'public');
            }

            if ($request->hasFile('scouting_reports')) {
                $validatedData['scouting_reports'] = $request->file('scouting_reports')->store('scouting_reports', 'public');
            }

            if ($request->hasFile('video_highlights')) {
                $validatedData['video_highlights'] = $request->file('video_highlights')->store('video_highlights', 'public');
            }

            // Update user model
            User::where('id', $user->id)->update([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name']
            ]);

            foreach ($validated as $key => $value) {
                $scout->$key = $value;
            }
            $scout->save();

            return response()->json([
                'message' => 'Scout profile updated successfully.',
                'data' => $scout,
            ]);
        } else {
            return response()->json(['message' => 'Invalid user type.'], 400);
        }
    }

//     public function delete(Request $request) {
//         $user = auth()->user();

//         $request->validate([
//             'password' => 'required|string',
//         ]);

//         if (!Hash::check($request->password, $user->password)) {
//             return response()->json(['message' => 'Incorrect password'], 403);
//         }
//         if ($user->user_type=='player') {
//             $user->player()->delete();
//             $user->delete();
//             return response()->json(['message' => 'Player account deactivated permanently'],200);
//         }

//         if ($user->user_type=='scout') {
//             $user->scout()->delete();
//             $user->delete();
//             return response()->json(['message' => 'Scout account deactivated permanently'],200);
//         }
//     }
}
