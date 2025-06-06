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
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use App\Models\Event;
use App\Models\Payment;
use App\Models\Subscription;

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

    // Subscription Management Methods
    public function getSubscriptionPlans()
    {
        try {
            $plans = \App\Models\Plan::all();
            return response()->json([
                'status' => 'success',
                'data' => $plans
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching subscription plans: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching subscription plans'], 500);
        }
    }

    public function updatePlan(Request $request, $id)
    {
        try {
            $plan = \App\Models\Plan::findOrFail($id);
            $request->validate([
                'Name' => 'required|string',
                'Duration' => 'required|integer',
                'Price' => 'required|numeric'
            ]);

            $plan->update($request->all());
            return response()->json([
                'status' => 'success',
                'message' => 'Plan updated successfully',
                'data' => $plan
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating plan: ' . $e->getMessage());
            return response()->json(['message' => 'Error updating plan'], 500);
        }
    }

    public function getUserSubscriptions()
    {
        try {
            $subscriptions = \App\Models\Subscription::with(['user', 'plan', 'payment'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($subscription) {
                    $user = $subscription->user;
                    return [
                        'id' => $subscription->id,
                        'user' => [
                            'id' => $user->id,
                            'name' => $user->first_name . ' ' . $user->last_name,
                            'email' => $user->email,
                            'type' => $user->user_type
                        ],
                        'plan' => $subscription->plan,
                        'status' => $subscription->active ? 'Active' : 'Inactive',
                        'expires_at' => $subscription->expires_at,
                        'created_at' => $subscription->created_at,
                        'payment' => $subscription->payment ? [
                            'amount' => $subscription->payment->amount,
                            'card_last_four' => $subscription->payment->card_last_four,
                            'created_at' => $subscription->payment->created_at
                        ] : null
                    ];
                });

            return response()->json([
                'status' => 'success',
                'data' => $subscriptions
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching user subscriptions: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching user subscriptions'], 500);
        }
    }

    public function updateUserSubscription(Request $request, $userId)
    {
        try {
            DB::beginTransaction();

            $user = \App\Models\User::findOrFail($userId);
            $newPlan = \App\Models\Plan::findOrFail($request->plan_id);

            // Update subscription record
            $subscription = \App\Models\Subscription::where('user_id', $userId)->first();
            if (!$subscription) {
                $subscription = new \App\Models\Subscription();
                $subscription->user_id = $userId;
            }

            $subscription->plan_id = $newPlan->id;
            $subscription->active = true;
            $subscription->expires_at = now()->addDays($newPlan->Duration);
            $subscription->save();

            // Update user-specific subscription fields
            if ($user->user_type === 'scout') {
                $user->scout->update([
                    'subscription_id' => $subscription->id,
                    'subscription_active' => true,
                    'subscription_expires_at' => $subscription->expires_at
                ]);
            } else {
                $user->player->update([
                    'subscription_id' => $subscription->id,
                    'subscription_expires_at' => $subscription->expires_at,
                    'membership' => $newPlan->Name === 'Player Monthly' || $newPlan->Name === 'Player Yearly' ? 'premium' : 'free'
                ]);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Subscription updated successfully',
                'data' => $subscription
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating user subscription: ' . $e->getMessage());
            return response()->json(['message' => 'Error updating user subscription'], 500);
        }
    }

    public function getPaymentHistory()
    {
        try {
            Log::info('Fetching payment history');

            $payments = \App\Models\Payment::with(['invoices', 'user'])
                ->orderBy('created_at', 'desc')
                ->get();

            Log::info('Raw payments data:', [
                'count' => $payments->count(),
                'first_payment' => $payments->first()
            ]);

            $formattedPayments = $payments->map(function($payment) {
                $data = [
                    'id' => $payment->id,
                    'amount' => $payment->amount,
                    'card_last_four' => $payment->card_last_four,
                    'cardholder_name' => $payment->cardholder_name,
                    'created_at' => $payment->created_at,
                    'user' => null,
                    'invoices' => []
                ];

                if ($payment->user) {
                    $data['user'] = [
                        'name' => $payment->user->first_name . ' ' . $payment->user->last_name,
                        'email' => $payment->user->email
                    ];
                }

                if ($payment->invoices) {
                    $data['invoices'] = $payment->invoices->map(function($invoice) {
                        return [
                            'id' => $invoice->id,
                            'issue_date' => $invoice->IssueDate,
                            'status' => $invoice->Status
                        ];
                    })->toArray();
                }

                return $data;
            });

            Log::info('Formatted payments data:', [
                'count' => $formattedPayments->count(),
                'first_payment' => $formattedPayments->first()
            ]);

            return response()->json([
                'status' => 'success',
                'data' => $formattedPayments
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching payment history: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching payment history: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deactivateUserSubscription(Request $request, $userId)
    {
        try {
            DB::beginTransaction();

            $user = \App\Models\User::findOrFail($userId);
            $subscription = \App\Models\Subscription::where('user_id', $userId)->first();

            if (!$subscription) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No subscription found for this user'
                ], 404);
            }

            // Update subscription record
            $subscription->update([
                'active' => false,
                'expires_at' => now()
            ]);

            // Update user-specific subscription fields
            if ($user->user_type === 'scout') {
                $user->scout->update([
                    'subscription_active' => false,
                    'subscription_expires_at' => now()
                ]);
            } else {
                $user->player->update([
                    'membership' => 'free',
                    'subscription_expires_at' => now()
                ]);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Subscription deactivated successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deactivating subscription: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error deactivating subscription'
            ], 500);
        }
    }

    // User Management Methods
    public function getUsers(Request $request)
    {
        try {
            $query = User::with(['player', 'scout'])
                ->where('user_type', '!=', 'admin');

            // Apply search filters
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('id', 'like', "%{$search}%");
                });
            }

            // Filter by user type
            if ($request->has('type') && in_array($request->type, ['player', 'scout'])) {
                $query->where('user_type', $request->type);
            }

            $users = $query->orderBy('created_at', 'desc')->get()
                ->map(function($user) {
                    return [
                        'id' => $user->id,
                        'first_name' => $user->first_name,
                        'last_name' => $user->last_name,
                        'email' => $user->email,
                        'user_type' => $user->user_type,
                        'email_verified_at' => $user->email_verified_at,
                        'created_at' => $user->created_at,
                        'setup_completed' => $user->setup_completed
                    ];
                });

            return response()->json([
                'status' => 'success',
                'data' => $users
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching users: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching users'], 500);
        }
    }

    public function getUserDetails($id)
    {
        try {
            $user = User::with(['player', 'scout', 'videos', 'comments', 'likes'])
                ->where('id', $id)
                ->where('user_type', '!=', 'admin')
                ->firstOrFail();

            $data = [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'user_type' => $user->user_type,
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at,
                'setup_completed' => $user->setup_completed,
                'videos_count' => $user->videos->count(),
                'comments_count' => $user->comments->count(),
                'likes_count' => $user->likes->count()
            ];

            if ($user->user_type === 'player') {
                $data['player'] = $user->player ? [
                    'position' => $user->player->position,
                    'current_club' => $user->player->current_club,
                    'membership' => $user->player->membership,
                    'subscription_expires_at' => $user->player->subscription_expires_at
                ] : null;
            } else {
                $data['scout'] = $user->scout ? [
                    'organization' => $user->scout->organization,
                    'position_title' => $user->scout->position_title,
                    'subscription_active' => $user->scout->subscription_active,
                    'subscription_expires_at' => $user->scout->subscription_expires_at
                ] : null;
            }

            return response()->json([
                'status' => 'success',
                'data' => $data
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching user details: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching user details'], 500);
        }
    }

    public function deleteUser($id)
    {
        try {
            DB::beginTransaction();

            $user = User::where('id', $id)
                ->where('user_type', '!=', 'admin')
                ->firstOrFail();

            // Delete related data
            if ($user->videos) {
                foreach ($user->videos as $video) {
                    // Delete video file from storage
                    if ($video->file_path && Storage::exists($video->file_path)) {
                        Storage::delete($video->file_path);
                    }
                    // Delete thumbnail if exists
                    if ($video->thumbnail && Storage::exists($video->thumbnail)) {
                        Storage::delete($video->thumbnail);
                    }
                }
            }

            // Delete profile images
            if ($user->user_type === 'player' && $user->player) {
                if ($user->player->profile_image && Storage::exists($user->player->profile_image)) {
                    Storage::delete($user->player->profile_image);
                }
            } elseif ($user->user_type === 'scout' && $user->scout) {
                if ($user->scout->profile_image && Storage::exists($user->scout->profile_image)) {
                    Storage::delete($user->scout->profile_image);
                }
                if ($user->scout->id_proof_path && Storage::exists($user->scout->id_proof_path)) {
                    Storage::delete($user->scout->id_proof_path);
                }
                if ($user->scout->certifications) {
                    foreach ($user->scout->certifications as $cert) {
                        if (Storage::exists($cert)) {
                            Storage::delete($cert);
                        }
                    }
                }
            }

            // Delete the user (this will cascade delete related records due to foreign key constraints)
            $user->delete();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'User deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting user: ' . $e->getMessage());
            return response()->json(['message' => 'Error deleting user'], 500);
        }
    }

    public function createEvent(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|min:5',
                'description' => 'nullable|string',
                'date' => 'required|date',
                'time' => 'required|date_format:H:i',
                'location' => 'required|string',
                'organizer_contact' => 'required|email',
                'target_audience' => 'required|in:players,scouts,public',
                'image' => 'nullable|image|mimes:jpeg,png,jpg|max:5120', // 5MB max
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $eventData = $validator->validated();

            // Combine date and time
            $dateTime = $eventData['date'] . ' ' . $eventData['time'];
            $eventData['date'] = $dateTime;
            unset($eventData['time']); // Remove separate time field

            // Handle image upload if present
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $imagePath = $image->store('events', 'public');
                $eventData['image'] = $imagePath;
            }

            // Set status as approved since it's created by admin
            $eventData['status'] = 'approved';
            $eventData['organizer_id'] = Auth::id();

            // Create the event
            $event = Event::create($eventData);

            return response()->json([
                'status' => 'success',
                'message' => 'Event created successfully',
                'data' => $event
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating event: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create event. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getScoutDocuments($id)
    {
        try {
            $user = User::findOrFail($id);
            if ($user->user_type !== 'scout') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User is not a scout'
                ], 400);
            }

            $scout = $user->scout;
            if (!$scout) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Scout profile not found'
                ], 404);
            }

            $documents = [
                'id_proof' => $scout->id_proof_path ? url('storage/' . $scout->id_proof_path) : null,
                'certifications' => $scout->certifications ? array_map(function($cert) {
                    return url('storage/' . $cert);
                }, $scout->certifications) : []
            ];

            return response()->json([
                'status' => 'success',
                'data' => $documents
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching scout documents: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching scout documents'], 500);
        }
    }

    public function getVideos(Request $request)
    {
        try {
            $query = Video::with(['user' => function($query) {
                $query->select('id', 'first_name', 'last_name', 'email');
            }]);

            // Apply sorting
            if ($request->has('sort_by') && in_array($request->sort_by, ['views', 'likes'])) {
                $order = $request->get('order', 'desc');
                if ($request->sort_by === 'views') {
                    $query->withCount('views')->orderBy('views_count', $order);
                } else {
                    $query->withCount('likes')->orderBy('likes_count', $order);
                }
            } else {
                $query->orderBy('created_at', 'desc');
            }

            $videos = $query->get()->map(function($video) {
                return [
                    'id' => $video->id,
                    'title' => $video->title,
                    'views' => $video->views()->count(),
                    'likes' => $video->likes()->count(),
                    'comments' => $video->comments()->count(),
                    'status' => $video->status,
                    'thumbnail' => $video->thumbnail ? url('storage/' . $video->thumbnail) : null,
                    'duration' => $video->duration,
                    'created_at' => $video->created_at,
                    'user' => [
                        'name' => $video->user->first_name . ' ' . $video->user->last_name,
                        'email' => $video->user->email
                    ]
                ];
            });

            return response()->json([
                'status' => 'success',
                'data' => $videos
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching videos: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching videos'
            ], 500);
        }
    }

    public function getVideoDetails($id)
    {
        try {
            $video = Video::with([
                'user' => function($query) {
                    $query->select('id', 'first_name', 'last_name', 'email');
                },
                'comments.user' => function($query) {
                    $query->select('id', 'first_name', 'last_name', 'email');
                },
                'likes.user' => function($query) {
                    $query->select('id', 'first_name', 'last_name', 'email');
                }
            ])->findOrFail($id);

            $data = [
                'id' => $video->id,
                'title' => $video->title,
                'description' => $video->description,
                'file_path' => $video->file_path ? url('storage/' . $video->file_path) : null,
                'thumbnail' => $video->thumbnail ? url('storage/' . $video->thumbnail) : null,
                'duration' => $video->duration,
                'views' => $video->views()->count(),
                'likes' => $video->likes()->count(),
                'comments' => $video->comments->map(function($comment) {
                    return [
                        'id' => $comment->id,
                        'content' => $comment->content,
                        'created_at' => $comment->created_at,
                        'user' => [
                            'id' => $comment->user->id,
                            'name' => $comment->user->first_name . ' ' . $comment->user->last_name,
                            'email' => $comment->user->email
                        ]
                    ];
                }),
                'status' => $video->status,
                'created_at' => $video->created_at,
                'user' => [
                    'id' => $video->user->id,
                    'name' => $video->user->first_name . ' ' . $video->user->last_name,
                    'email' => $video->user->email
                ]
            ];

            return response()->json([
                'status' => 'success',
                'data' => $data
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching video details: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error fetching video details'
            ], 500);
        }
    }

    public function deleteVideo($id)
    {
        try {
            DB::beginTransaction();

            $video = Video::findOrFail($id);

            // Delete video file from storage
            if ($video->file_path && Storage::exists($video->file_path)) {
                Storage::delete($video->file_path);
            }

            // Delete thumbnail if exists
            if ($video->thumbnail && Storage::exists($video->thumbnail)) {
                Storage::delete($video->thumbnail);
            }

            // Delete associated records (likes, comments, views)
            $video->likes()->delete();
            $video->comments()->delete();
            $video->views()->delete();

            // Delete the video record
            $video->delete();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Video deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting video: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error deleting video'
            ], 500);
        }
    }

    public function deleteComment($videoId, $commentId)
    {
        try {
            $video = Video::findOrFail($videoId);
            $comment = $video->comments()->findOrFail($commentId);
            $comment->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Comment deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting comment: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error deleting comment'
            ], 500);
        }
    }
}

