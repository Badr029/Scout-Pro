<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Player;
use Illuminate\Support\Facades\Validator;
use App\Models\user;

class PlayerSetupController extends Controller
{
    public function setup(Request $request)
    {
        $user = auth()->user();

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
            'secondary_position' => 'nullable|string|max:255',
            'gender'             => 'required|in:male,female',
            'nationality'        => 'required|string|max:255',
            'current_city'       => 'required|string|max:255',
            'current_club'       => 'required|string|max:255',
            'previous_clubs'     => 'nullable|array',
            'previous_clubs.*'   => 'string|max:255',
            'playing_style'      => 'nullable|string|max:255',
            'transfer_status'    => 'nullable|string|max:255',
            'bio'                => 'nullable|string|max:1000',
        ]);



        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }


        // $photoPath = $request
        //     ->file('personal_id_photo')
        //     ->store('personal_ids', 'public');


        $player = Player::create([
            'user_id'            => auth()->id(),
            // 'username'           => $user->username,
            // 'first_name'         => $user->first_name,
            // 'last_name'          => $user->last_name,
            'profile_image'      => $request->profile_image,
            'DateofBirth'        => $request->DateofBirth,
            'phone_number'       => $request->phone_number,
            'height'             => $request->height,
            'weight'             => $request->weight,
            'preferred_foot'     => $request->preferred_foot,
            'position'           => $request->position,
            'secondary_position' => $request->secondary_position,
            'gender'             => $request->gender,
            'nationality'        => $request->nationality,
            'current_city'       => $request->current_city,
            'current_club'       => $request->current_club,
            'previous_clubs'     => $request->previous_clubs,
            'playing_style'      => $request->playing_style,
            'transfer_status'    => $request->transfer_status,
            'bio'                => $request->bio,
        ]);

        return response()->json([
            'message' => 'Player profile setup completed successfully.',
            'player'  => $player,
        ], 201);
    }
}
