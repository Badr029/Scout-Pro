<?php

namespace App\Http\Controllers\APi;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Scout;
use App\Models\User;

class ScoutSetupController extends Controller
{
    public function setup(Request $request){

        $user = auth()->user();

        if ($user->user_type !== 'scout') {
            return response()->json(['error' => 'Unauthorized: Only scouts can complete this setup.'], 403);
        }

        $validator = Validator::make($request->all(),[

            'profile_image'      => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
           // Basic Info

           'city' => 'required|string|max:255',
           'country' => 'required|string|max:255',
           'languages_spoken' => 'required|string|max:255',

           // Professional Info
           'scouting_role' => 'required|string|max:255',
           'affiliation' => 'nullable|string|max:255',
           'experience_years' => 'nullable|integer|min:0|max:100',
           'player_levels' => 'nullable|string|max:255',
           'regions_covered' => 'nullable|string|max:255',

           // Specialization
           'age_groups' => 'nullable|string|max:255',
           'positions_focused' => 'nullable|string|max:255',
           'scouting_criteria' => 'nullable|string|max:1000',
           'preferred_playing_style' => 'nullable|string|max:1000',

           // Portfolio
           'players_discovered' => 'nullable|string|max:1000',
           'clubs_worked_with' => 'nullable|string|max:1000',
           'achievements' => 'nullable|string|max:1000',
           'references' => 'nullable|string|max:1000',

           // Contact
           'contact_email' => 'nullable|email|max:255',
           'contact_phone' => 'nullable|string|max:20',
           'social_links' => 'nullable|string|max:1000',
           'available_for_events' => 'nullable|boolean',
           'willing_to_travel' => 'nullable|boolean',

           // Tools
           'scouting_reports' => 'nullable|file|mimes:pdf,jpeg,png,jpg|max:4096',
           'video_highlights' => 'nullable|file|mimes:mp4,mov,avi|max:10240',
           'certifications' => 'nullable|string|max:1000',

        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $profilePhotoPath = $request->hasFile('profile_photo')
        ? $request->file('profile_photo')->store('scouts/profile_photos', 'public')
        : null;

    $scoutingReportPath = $request->hasFile('scouting_reports')
        ? $request->file('scouting_reports')->store('scouts/reports', 'public')
        : null;

    $videoPath = $request->hasFile('video_highlights')
        ? $request->file('video_highlights')->store('scouts/videos', 'public')
        : null;

        // if ($request->hasFile('id_front')) {
        //     $validated['id_front_path'] = $request->file('id_front')->store('id_docs', 'public');
        // }

        // if ($request->hasFile('id_back')) {
        //     $validated['id_back_path'] = $request->file('id_back')->store('id_docs', 'public');
        // }
        // $userId = auth()->id();

        $scout = Scout::create([
            'user_id' => auth()->id(),
            'profile_image'      => $request->profile_image,
            // 'user_name' => $user->name,
            // "first_name"             => $user->first_name,
            // "last_name"              => $user->last_name,
            'city' => $request->city,
            'country' => $request->country,
            'languages_spoken' => $request->languages_spoken,

            'scouting_role' => $request->scouting_role,
            'affiliation' => $request->affiliation,
            'experience_years' => $request->experience_years,
            'player_levels' => $request->player_levels,
            'regions_covered' => $request->regions_covered,

            'age_groups' => $request->age_groups,
            'positions_focused' => $request->positions_focused,
            'scouting_criteria' => $request->scouting_criteria,
            'preferred_playing_style' => $request->preferred_playing_style,

            'players_discovered' => $request->players_discovered,
            'clubs_worked_with' => $request->clubs_worked_with,
            'achievements' => $request->achievements,
            'references' => $request->references,

            'contact_email' => $request->contact_email,
            'contact_phone' => $request->contact_phone,
            'social_links' => $request->social_links,
            'available_for_events' => $request->available_for_events ?? false,
            'willing_to_travel' => $request->willing_to_travel ?? false,

            'scouting_reports' => $scoutingReportPath,
            'video_highlights' => $videoPath,
            'certifications' => $request->certifications,

        ]);


        return response()->json([
            'message' => 'Scout profile setup completed successfully.',
            'scout' => $scout,
        ], 201);


    }
}
