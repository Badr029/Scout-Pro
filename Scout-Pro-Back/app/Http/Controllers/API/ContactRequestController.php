<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ContactRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Traits\NotificationHelper;

class ContactRequestController extends Controller
{
    use NotificationHelper;

    public function store(Request $request)
    {
        try {
            $scout = Auth::user();

            // Verify the user is a scout
            if ($scout->user_type !== 'scout') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Only scouts can send contact requests.'
                ], 403);
            }

            // Validate request
            $request->validate([
                'player_id' => 'required|exists:users,id',
                'message' => 'nullable|string|max:500'
            ]);

            // Verify the target user is a player
            $player = User::findOrFail($request->player_id);
            if ($player->user_type !== 'player') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Contact requests can only be sent to players.'
                ], 400);
            }

            // Check if a request already exists
            $existingRequest = ContactRequest::where('scout_id', $scout->id)
                ->where('player_id', $player->id)
                ->first();

            if ($existingRequest) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'A contact request has already been sent to this player.',
                    'request_status' => $existingRequest->status
                ], 400);
            }

            // Create the contact request
            $contactRequest = ContactRequest::create([
                'scout_id' => $scout->id,
                'player_id' => $player->id,
                'message' => $request->message,
                'status' => 'pending'
            ]);

            // Create notification for the player
            $this->createContactRequestNotification($scout, $player);

            // Create pending notification for the scout
            $this->createContactRequestStatusNotification($scout, 'pending');

            return response()->json([
                'status' => 'success',
                'message' => 'Your contact request has been sent successfully and is pending administrative review. You will be notified once it has been processed.',
                'data' => $contactRequest
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating contact request: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to send contact request. Please try again later.'
            ], 500);
        }
    }

    public function checkStatus($playerId)
    {
        try {
            $scout = Auth::user();

            if ($scout->user_type !== 'scout') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized'
                ], 403);
            }

            $contactRequest = ContactRequest::where('scout_id', $scout->id)
                ->where('player_id', $playerId)
                ->first();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'has_request' => !is_null($contactRequest),
                    'request_status' => $contactRequest ? $contactRequest->status : null
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error checking contact request status: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to check request status.'
            ], 500);
        }
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected'
        ]);

        $contactRequest = ContactRequest::findOrFail($id);

        // Only admin can update status
        if (Auth::user()->user_type !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $contactRequest->update([
            'status' => $request->status,
            'responded_at' => now()
        ]);

        // Create notification for the scout
        $this->createContactRequestStatusNotification(
            User::find($contactRequest->scout_id),
            $request->status
        );

        return response()->json([
            'message' => 'Contact request status updated successfully',
            'contact_request' => $contactRequest
        ]);
    }
}
