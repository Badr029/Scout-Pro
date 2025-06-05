<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Player;
use Illuminate\Support\Facades\Validator;
use App\Models\Scout;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class SetupController extends Controller
{
    public function playerSetup(Request $request)
    {
        $user = Auth::user();

        if ($user->user_type !== 'player') {
            return response()->json(['error' => 'Unauthorized: Only players can complete this setup.'], 403);
        }

        $validator = Validator::make($request->all(), [
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

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $profilePhotoPath = $request->hasFile('profile_image')
            ? $request->file('profile_image')->store('players/profile_image', 'public')
            : null;

        // Decode JSON fields
        $secondaryPosition = json_decode($request->secondary_position, true);
        $previousClubs = json_decode($request->previous_clubs, true);

        $player = Player::create([
            'user_id' => Auth::id(),
            'profile_image' => $profilePhotoPath,
            'username' => $user->username,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'DateofBirth' => $request->DateofBirth,
            'phone_number' => $request->phone_number,
            'height' => $request->height,
            'weight' => $request->weight,
            'preferred_foot' => $request->preferred_foot,
            'position' => $request->position,
            'secondary_position' => $secondaryPosition,
            'gender' => $request->gender,
            'nationality' => $request->nationality,
            'current_city' => $request->current_city,
            'current_club' => $request->current_club,
            'previous_clubs' => $previousClubs,
            'playing_style' => $request->playing_style,
            'transfer_status' => $request->transfer_status,
            'bio' => $request->bio,
        ]);

        // Mark setup as completed
        User::where('id', Auth::id())->update(['setup_completed' => true]);

        return response()->json([
            'message' => 'Player profile setup completed successfully.',
            'player' => $player,
        ], 201);
    }

    public function scoutSetup(Request $request)
    {
        $user = Auth::user();

        if ($user->user_type !== 'scout') {
            return response()->json(['error' => 'Unauthorized: Only scouts can complete this setup.'], 403);
        }

        $validator = Validator::make($request->all(),[
            'profile_image'      => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'city' => 'required|string|max:255',
            'country' => 'required|string|max:255',
            'contact_email' => 'required|email|max:255',
            'contact_phone' => 'required|string|max:20',

            // Organization and Role Information
            'organization' => 'required|string|max:255',
            'position_title' => 'required|string|max:255',
            'scouting_regions' => 'required|json',
            'age_groups' => 'required|json',
            'preferred_roles' => 'required|json',
            'clubs_worked_with' => 'required|string|max:1000',

            // Professional Information
            'linkedin_url' => 'nullable|url|max:255',
            'id_proof' => 'required|file|mimes:pdf,jpeg,png,jpg|max:5120',
            'certifications' => 'required|array|min:1',
            'certifications.*' => 'required|file|mimes:pdf,jpeg,png,jpg|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Handle profile image upload
        $profilePhotoPath = $request->hasFile('profile_image')
            ? $request->file('profile_image')->store('scouts/profile_image', 'public')
            : null;

        // Handle ID proof upload
        $idProofPath = $request->hasFile('id_proof')
            ? $request->file('id_proof')->store('scouts/id_proofs', 'public')
            : null;

        // Handle certification uploads
        $certificationPaths = [];
        if ($request->hasFile('certifications')) {
            foreach ($request->file('certifications') as $certification) {
                $certificationPaths[] = $certification->store('scouts/certifications', 'public');
            }
        }

        // Decode JSON fields
        $scoutingRegions = json_decode($request->scouting_regions, true);
        $ageGroups = json_decode($request->age_groups, true);
        $preferredRoles = json_decode($request->preferred_roles, true);

        $scout = Scout::create([
            'user_id' => Auth::id(),
            'profile_image' => $profilePhotoPath,
            'username' => $user->username,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'city' => $request->city,
            'country' => $request->country,
            'contact_email' => $request->contact_email,
            'contact_phone' => $request->contact_phone,

            // Organization and Role Information
            'organization' => $request->organization,
            'position_title' => $request->position_title,
            'scouting_regions' => $scoutingRegions,
            'age_groups' => $ageGroups,
            'preferred_roles' => $preferredRoles,
            'clubs_worked_with' => $request->clubs_worked_with,

            // Professional Information
            'linkedin_url' => $request->linkedin_url,
            'id_proof_path' => $idProofPath,
            'certifications' => $certificationPaths,
            'registration_completed' => true,
            'subscription_active' => false
        ]);

        // Mark setup as completed
        User::where('id', Auth::id())->update(['setup_completed' => true]);

        return response()->json([
            'message' => 'Scout profile setup completed successfully.',
            'scout' => $scout,
        ], 201);
    }
}
