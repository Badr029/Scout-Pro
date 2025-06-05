<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Video;
use App\Models\Like;
use App\Models\Comment;
use App\Models\Follow;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use App\Mail\ContactRequestApproved;
use App\Mail\ContactRequestRejected;
use App\Mail\EventRequestApproved;
use App\Mail\EventRequestRejected;

class AdminController extends Controller
{
    public function stats()
    {
        try {
            $totalPlayers = User::where('user_type', 'player')->count();
            $totalScouts = User::where('user_type', 'scout')->count();
            $totalUsers = $totalPlayers + $totalScouts;
            $totalVideos = Video::count();
            $totalLikes = Like::count();
            $totalComments = Comment::count();
            $totalFollows = Follow::count();

            return response()->json([
                'totalUsers' => $totalUsers,
                'totalPlayers' => $totalPlayers,
                'totalScouts' => $totalScouts,
                'totalVideos' => $totalVideos,
                'totalLikes' => $totalLikes,
                'totalComments' => $totalComments,
                'totalFollows' => $totalFollows,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching admin stats: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching statistics'], 500);
        }
    }

    public function userGrowth()
    {
        try {
            $userGrowth = User::select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
                ->where('created_at', '>=', Carbon::now()->subDays(30))
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            // Fill in missing dates with zero values
            $dates = collect();
            for ($i = 29; $i >= 0; $i--) {
                $dates->push(Carbon::now()->subDays($i)->format('Y-m-d'));
            }

            $growthData = $userGrowth->pluck('count', 'date')->toArray();
            $filledData = $dates->mapWithKeys(function ($date) use ($growthData) {
                return [$date => $growthData[$date] ?? 0];
            });

            return response()->json([
                'labels' => $filledData->keys(),
                'values' => $filledData->values(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching user growth data: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching user growth data'], 500);
        }
    }

    public function engagement()
    {
        try {
            $thirtyDaysAgo = Carbon::now()->subDays(30);

            $likes = Like::where('created_at', '>=', $thirtyDaysAgo)->count();
            $comments = Comment::where('created_at', '>=', $thirtyDaysAgo)->count();
            $follows = Follow::where('created_at', '>=', $thirtyDaysAgo)->count();

            return response()->json([
                'likes' => $likes,
                'comments' => $comments,
                'follows' => $follows,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching engagement data: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching engagement data'], 500);
        }
    }

    public function videoStats()
    {
        try {
            $totalVideos = Video::count();
            $activeVideos = Video::where('status', 'active')->count();
            $processingVideos = Video::where('status', 'processing')->count();

            return response()->json([
                'total' => $totalVideos,
                'active' => $activeVideos,
                'processing' => $processingVideos,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching video stats: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching video statistics'], 500);
        }
    }

    public function getContactRequests()
    {
        try {
            $requests = \App\Models\ContactRequest::with(['scout.scout', 'player.player'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($request) {
                    return [
                        'id' => $request->id,
                        'scout' => [
                            'id' => $request->scout->id,
                            'name' => $request->scout->first_name . ' ' . $request->scout->last_name,
                            'email' => $request->scout->email,
                            'profile' => $request->scout->scout ? [
                                'company' => $request->scout->scout->organization,
                                'position' => $request->scout->scout->position_title,
                                'region' => $request->scout->scout->scouting_regions,
                                'profile_image' => $request->scout->scout->profile_image ? url('storage/' . $request->scout->scout->profile_image) : null
                            ] : null
                        ],
                        'player' => [
                            'id' => $request->player->id,
                            'name' => $request->player->first_name . ' ' . $request->player->last_name,
                            'email' => $request->player->email,
                            'profile' => $request->player->player ? [
                                'position' => $request->player->player->position,
                                'nationality' => $request->player->player->nationality,
                                'current_city' => $request->player->player->current_city,
                                'profile_image' => $request->player->player->profile_image ? url('storage/' . $request->player->player->profile_image) : null
                            ] : null
                        ],
                        'status' => $request->status,
                        'message' => $request->message,
                        'created_at' => $request->created_at,
                        'responded_at' => $request->responded_at
                    ];
                });

            return response()->json([
                'status' => 'success',
                'data' => $requests
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching contact requests: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching contact requests'], 500);
        }
    }

    public function updateContactRequest($id, Request $request)
    {
        try {
            $contactRequest = \App\Models\ContactRequest::with(['scout.scout', 'player.player'])->findOrFail($id);
            $contactRequest->status = $request->status;
            $contactRequest->responded_at = now();
            $contactRequest->save();

            $scout = $contactRequest->scout;
            $player = $contactRequest->player;

            // For debugging
            Log::info('Player data:', [
                'player_id' => $player->id,
                'player_model' => $player->player,
                'phone_number' => $player->player->phone_number ?? 'not found in player model'
            ]);

            // Send appropriate email based on status
            if ($request->status === 'approved') {
                Mail::to($scout->email)->send(new ContactRequestApproved([
                    'scout_name' => $scout->first_name,
                    'player_name' => $player->first_name . ' ' . $player->last_name,
                    'player_email' => $player->email,
                    'player_phone' => $player->player->phone_number ?? 'Not provided', // Access through player relationship
                    'message' => $contactRequest->message
                ]));
            } else if ($request->status === 'rejected') {
                Mail::to($scout->email)->send(new ContactRequestRejected([
                    'scout_name' => $scout->first_name,
                    'player_name' => $player->first_name . ' ' . $player->last_name,
                    'message' => $contactRequest->message
                ]));
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Contact request updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating contact request: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'message' => 'Error updating contact request: ' . $e->getMessage(),
                'details' => [
                    'request_id' => $id,
                    'status' => $request->status ?? 'not provided',
                    'error' => $e->getMessage()
                ]
            ], 500);
        }
    }

    public function getEventRequests()
    {
        try {
            $requests = \App\Models\Event::with(['organizerWithProfile'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($event) {
                    $organizer = $event->organizer;
                    $scoutProfile = $organizer->scout;

                    return [
                        'id' => $event->id,
                        'title' => $event->title,
                        'description' => $event->description,
                        'date' => $event->date,
                        'location' => $event->location,
                        'image' => $event->image ? url('storage/' . $event->image) : null,
                        'organizer_contact' => $event->organizer_contact,
                        'target_audience' => $event->target_audience,
                        'status' => $event->status,
                        'rejection_reason' => $event->rejection_reason,
                        'responded_at' => $event->responded_at,
                        'created_at' => $event->created_at,
                        'organizer' => [
                            'id' => $organizer->id,
                            'name' => $organizer->first_name . ' ' . $organizer->last_name,
                            'email' => $organizer->email,
                            'profile' => $scoutProfile ? [
                                'company' => $scoutProfile->organization,
                                'region' => $scoutProfile->scouting_regions,
                                'profile_image' => $scoutProfile->profile_image ? url('storage/' . $scoutProfile->profile_image) : null
                            ] : null
                        ]
                    ];
                });

            return response()->json([
                'status' => 'success',
                'data' => $requests
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching event requests: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching event requests'], 500);
        }
    }

    public function updateEventRequest($id, Request $request)
    {
        try {
            $event = \App\Models\Event::with(['organizerWithProfile'])->findOrFail($id);

            // Validate request
            $request->validate([
                'status' => 'required|in:approved,rejected',
                'rejection_reason' => 'required_if:status,rejected|nullable|string'
            ]);

            $event->status = $request->status;
            $event->rejection_reason = $request->rejection_reason;
            $event->responded_at = now();
            $event->save();

            // Send email notifications
            $organizer = $event->organizer;
            if ($request->status === 'approved') {
                Mail::to($organizer->email)->send(new EventRequestApproved([
                    'organizer_name' => $organizer->first_name,
                    'event_title' => $event->title,
                    'event_date' => $event->date,
                    'event_location' => $event->location
                ]));
            } else {
                Mail::to($organizer->email)->send(new EventRequestRejected([
                    'organizer_name' => $organizer->first_name,
                    'event_title' => $event->title,
                    'rejection_reason' => $event->rejection_reason
                ]));
            }

            // Refresh the event to get updated relationships
            $event->refresh();

            return response()->json([
                'status' => 'success',
                'message' => 'Event request updated successfully',
                'data' => [
                    'id' => $event->id,
                    'title' => $event->title,
                    'description' => $event->description,
                    'date' => $event->date,
                    'location' => $event->location,
                    'image' => $event->image ? url('storage/' . $event->image) : null,
                    'organizer_contact' => $event->organizer_contact,
                    'target_audience' => $event->target_audience,
                    'status' => $event->status,
                    'rejection_reason' => $event->rejection_reason,
                    'responded_at' => $event->responded_at,
                    'created_at' => $event->created_at,
                    'organizer' => [
                        'id' => $event->organizer->id,
                        'name' => $event->organizer->first_name . ' ' . $event->organizer->last_name,
                        'email' => $event->organizer->email,
                        'profile' => $event->organizer->scout ? [
                            'company' => $event->organizer->scout->organization,
                            'region' => $event->organizer->scout->scouting_regions,
                            'profile_image' => $event->organizer->scout->profile_image ? url('storage/' . $event->organizer->scout->profile_image) : null
                        ] : null
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating event request: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'message' => 'Error updating event request: ' . $e->getMessage(),
                'details' => [
                    'request_id' => $id,
                    'status' => $request->status ?? 'not provided',
                    'error' => $e->getMessage()
                ]
            ], 500);
        }
    }
}

