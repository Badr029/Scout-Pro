<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Like;
use App\Models\Follow;
use App\Models\Event;
use App\Models\Player;
use App\Models\Post;
use App\Models\User;
use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Builder;
use App\Models\Scout;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FeedController extends Controller
{
    /**
     * Display the feed for the authenticated user.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $userType = $user->user_type;

        // Get filter parameters
        $position = $request->input('position');
        $secondary_position = $request->input('secondary_position');
        $region = $request->input('region');
        $age = $request->input('age');
        $height = $request->input('height');
        $preferred_foot = $request->input('preferred_foot');
        $playing_style = $request->input('playing_style');
        $transfer_status = $request->input('transfer_status');

        // Build query for videos
        $videosQuery = Video::with([
            'user.player',
            'comments.user.player',
            'likes.user.player',
            'likes' => function ($query) use ($user) {
                $query->where('user_id', $user->id);
            }
        ])
        ->whereHas('user', function ($query) {
            $query->where('user_type', 'player');
        })
        ->orderBy('created_at', 'desc');

        // Apply filters if user is a scout
        if ($userType === 'scout') {
            if ($position) {
                $videosQuery->whereHas('user.player', function ($query) use ($position) {
                    $query->where('position', $position);
                });
            }
            if ($region) {
                $videosQuery->whereHas('user.player', function ($query) use ($region) {
                    $query->where('current_city', $region);
                });
            }
            if ($preferred_foot) {
                $videosQuery->whereHas('user.player', function ($query) use ($preferred_foot) {
                    $query->where('preferred_foot', $preferred_foot);
                });
            }
            if ($age) {
                $videosQuery->whereHas('user.player', function ($query) use ($age) {
                    $query->whereRaw('ABS(age) = ?', [abs((int)$age)]);
                });
            }
            if ($transfer_status) {
                $videosQuery->whereHas('user.player', function ($query) use ($transfer_status) {
                    $query->where('transfer_status', $transfer_status);
                });
            }
        }

        // Get videos with pagination
        $videos = $videosQuery->paginate(10);

        // Transform the videos to include user-specific data
        $videos->through(function ($video) use ($user) {
            // Add has_liked flag
            $video->has_liked = $video->likes->where('user_id', $user->id)->count() > 0;
            // Add following flag and user data
            if ($video->user) {
                $video->user->following = $this->getFollowState($video->user->id);
                $video->user->isCurrentUser = $video->user->id === $user->id;

                // Add profile image and player info
                if ($video->user->player) {
                    $video->user->profile_image = $video->user->player->profile_image ? url('storage/' . $video->user->player->profile_image) : null;
                    $video->user->player_info = [
                        'position' => $video->user->player->position,
                        'region' => $video->user->player->current_city,
                        'age' => abs($video->user->player->getAge()),
                        'preferred_foot' => $video->user->player->preferred_foot,
                        'transfer_status' => $video->user->player->transfer_status
                    ];
                }
            }

            // Format the likes data
            $video->likes_data = $video->likes->map(function ($like) {
                return [
                    'id' => $like->id,
                    'user_id' => $like->user_id,
                    'user' => [
                        'id' => $like->user->id,
                        'first_name' => $like->user->first_name,
                        'last_name' => $like->user->last_name,
                        'profile_image' => $like->user->player ? url('storage/' . $like->user->player->profile_image) : null
                    ]
                ];
            });

            // Format the comments data
            $video->comments_data = $video->comments->map(function ($comment) {
                // Get profile image based on user type
                $profileImage = null;
                if ($comment->user->user_type === 'scout' && $comment->user->scout) {
                    $profileImage = $comment->user->scout->profile_image;
                } elseif ($comment->user->user_type === 'player' && $comment->user->player) {
                    $profileImage = $comment->user->player->profile_image;
                }

                return [
                    'id' => $comment->id,
                    'content' => $comment->content,
                    'created_at' => $comment->created_at,
                    'user_id' => $comment->user_id,
                    'user' => [
                        'id' => $comment->user->id,
                        'first_name' => $comment->user->first_name,
                        'last_name' => $comment->user->last_name,
                        'profile_image' => $profileImage ? url('storage/' . $profileImage) : null,
                        'user_type' => $comment->user->user_type,
                        'scout_id' => $comment->user->scout ? $comment->user->scout->id : null,
                        'player_id' => $comment->user->player ? $comment->user->player->id : null
                    ]
                ];
            });

            return $video;
        });

        // Get trending players (based on video views and likes)
        $trendingPlayers = User::where('user_type', 'player')
            ->whereHas('videos', function ($query) {
                $query->orderByDesc('views')
                    ->orderByDesc('created_at');
            })
            ->with('player')
            ->take(5)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->first_name . ' ' . $user->last_name,
                    'position' => $user->player ? $user->player->position : null,
                    'region' => $user->player ? $user->player->current_city : null,
                    'profile_image' => $user->player && $user->player->profile_image ? url('storage/' . $user->player->profile_image) : null,
                ];
            });

        // Get upcoming events
        $upcomingEvents = Event::where('date', '>=', now())
            ->orderBy('date')
            ->take(3)
            ->get();

        // Get recommended players based on user's interests
        $recommendedPlayers = [];
        if ($userType === 'scout' && $user->scout) {
            $recommendedPlayers = User::where('user_type', 'player')
                ->whereHas('player', function ($query) use ($user) {
                    if ($user->scout->preferred_positions) {
                        $positions = explode(',', $user->scout->preferred_positions);
                        $query->whereIn('position', $positions);
                    }
                })
                ->with('player')
                ->take(5)
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->first_name . ' ' . $user->last_name,
                        'position' => $user->player ? $user->player->position : null,
                        'region' => $user->player ? $user->player->current_city : null,
                        'image' => $user->player && $user->player->profile_image
                            ? url('storage/' . $user->player->profile_image)
                            : null,
                    ];
                });
        }

        // Get filter options
        $filterOptions = [
            [
                'label' => 'Position',
                'key' => 'position',
                'options' => [
                    ['label' => 'All', 'value' => ''],
                    ['label' => 'Forward', 'value' => 'forward'],
                    ['label' => 'Midfielder', 'value' => 'midfielder'],
                    ['label' => 'Defender', 'value' => 'defender'],
                    ['label' => 'Goalkeeper', 'value' => 'goalkeeper']
                ]
            ],
            [
                'label' => 'Secondary Position',
                'key' => 'secondary_position',
                'options' => [
                    ['label' => 'All', 'value' => ''],
                    ['label' => 'Forward', 'value' => 'forward'],
                    ['label' => 'Midfielder', 'value' => 'midfielder'],
                    ['label' => 'Defender', 'value' => 'defender'],
                    ['label' => 'Goalkeeper', 'value' => 'goalkeeper']
                ]
            ],
            [
                'label' => 'Region',
                'key' => 'region',
                'options' => [
                    ['label' => 'All', 'value' => ''],
                    ['label' => 'Europe', 'value' => 'europe'],
                    ['label' => 'Africa', 'value' => 'africa'],
                    ['label' => 'Asia', 'value' => 'asia'],
                    ['label' => 'North America', 'value' => 'north america'],
                    ['label' => 'South America', 'value' => 'south america'],
                    ['label' => 'Oceania', 'value' => 'oceania']
                ]
            ],
            [
                'label' => 'Preferred Foot',
                'key' => 'preferred_foot',
                'options' => [
                    ['label' => 'All', 'value' => ''],
                    ['label' => 'Right', 'value' => 'right'],
                    ['label' => 'Left', 'value' => 'left'],
                    ['label' => 'Both', 'value' => 'both']
                ]
            ],
            [
                'label' => 'Playing Style',
                'key' => 'playing_style',
                'options' => [
                    ['label' => 'All', 'value' => ''],
                    ['label' => 'Attacker', 'value' => 'attacker'],
                    ['label' => 'Playmaker', 'value' => 'playmaker'],
                    ['label' => 'Defender', 'value' => 'defender'],
                    ['label' => 'Box-to-Box', 'value' => 'box-to-box']
                ]
            ],
            [
                'label' => 'Transfer Status',
                'key' => 'transfer_status',
                'options' => [
                    ['label' => 'All', 'value' => ''],
                    ['label' => 'Available', 'value' => 'available'],
                    ['label' => 'Not Available', 'value' => 'not_available']
                ]
            ]
        ];

        // Get suggested searches
        $suggestedSearches = [
            'Forward',
            'Under 18',
            'London',
            'Available for transfer'
        ];

        return response()->json([
            'status' => 'success',
            'user_type' => $userType,
            'filter_options' => $filterOptions,
            'posts' => $videos,
                'trending_players' => $trendingPlayers,
                'upcoming_events' => $upcomingEvents,
            'recommendations' => $recommendedPlayers,
            'suggested_searches' => $suggestedSearches
        ]);
    }

    /**
     * Search and filter players based on user type
     */
    public function search(Request $request)
    {
        try {
            $user = Auth::user();
            $query = $request->get('search_query', '');
            $filters = $request->get('filters', []);
            $userType = $request->get('user_type', $user->user_type);

            Log::info('Search request:', [
                'query' => $query,
                'filters' => $filters,
                'user_type' => $userType
            ]);

            // Search in players table
            $playersQuery = Player::select('players.*')
                ->join('users', 'players.user_id', '=', 'users.id')
                ->where(function($q) use ($query) {
                    $q->where('players.first_name', 'LIKE', "%{$query}%")
                      ->orWhere('players.last_name', 'LIKE', "%{$query}%")
                      ->orWhere('players.position', 'LIKE', "%{$query}%")
                      ->orWhere('players.nationality', 'LIKE', "%{$query}%")
                      ->orWhere('players.current_city', 'LIKE', "%{$query}%");
                });

            // Search in scouts table
            $scoutsQuery = Scout::select('scouts.*')
                ->join('users', 'scouts.user_id', '=', 'users.id')
                ->where(function($q) use ($query) {
                    $q->where('scouts.first_name', 'LIKE', "%{$query}%")
                      ->orWhere('scouts.last_name', 'LIKE', "%{$query}%")
                      ->orWhere('scouts.organization', 'LIKE', "%{$query}%")
                      ->orWhere('scouts.position_title', 'LIKE', "%{$query}%");
                });

            // Apply filters for players if user is a scout and filters are provided
            if ($userType === 'scout' && !empty($filters)) {
                Log::info('Applying scout filters:', $filters);

                if (!empty($filters['age_range'])) {
                    $ages = explode('-', $filters['age_range']);
                    if (count($ages) === 2) {
                        $minAge = (int)$ages[0];
                        $maxAge = (int)$ages[1];
                        $minDate = now()->subYears($maxAge)->format('Y-m-d');
                        $maxDate = now()->subYears($minAge)->format('Y-m-d');
                        $playersQuery->whereBetween('players.DateofBirth', [$minDate, $maxDate]);
                    }
                }

                if (!empty($filters['preferred_foot'])) {
                    $playersQuery->where('players.preferred_foot', $filters['preferred_foot']);
                }

                if (!empty($filters['region'])) {
                    $playersQuery->where(function($q) use ($filters) {
                        $q->where('players.current_city', 'LIKE', "%{$filters['region']}%")
                          ->orWhere('players.nationality', 'LIKE', "%{$filters['region']}%");
                    });
                }

                if (!empty($filters['position'])) {
                    $playersQuery->where('players.position', 'LIKE', "%{$filters['position']}%");
                }

                if (!empty($filters['transfer_status'])) {
                    $playersQuery->where('players.transfer_status', $filters['transfer_status']);
                }
            }

            // Get results based on user type
            $results = [];
            if ($userType === 'scout') {
                // Scouts only search for players
                $results = $playersQuery->get()->map(function($player) {
                    return [
                        'id' => $player->id,
                        'user_id' => $player->user_id,
                        'first_name' => $player->first_name,
                        'last_name' => $player->last_name,
                        'profile_image' => $player->profile_image,
                        'position' => $player->position,
                        'nationality' => $player->nationality,
                        'current_city' => $player->current_city,
                        'age' => abs($this->calculateAge($player->DateofBirth)),
                        'preferred_foot' => $player->preferred_foot,
                        'transfer_status' => $player->transfer_status,
                        'type' => 'player',
                        'membership' => $player->membership
                    ];
                });
            } else {
                // Players can search for both players and scouts
                $players = $playersQuery->get()->map(function($player) {
                    return [
                        'id' => $player->id,
                        'user_id' => $player->user_id,
                        'first_name' => $player->first_name,
                        'last_name' => $player->last_name,
                        'profile_image' => $player->profile_image,
                        'position' => $player->position,
                        'nationality' => $player->nationality,
                        'current_city' => $player->current_city,
                        'type' => 'player'
                    ];
                });

                $scouts = $scoutsQuery->get()->map(function($scout) {
                    return [
                        'id' => $scout->id,
                        'user_id' => $scout->user_id,
                        'first_name' => $scout->first_name,
                        'last_name' => $scout->last_name,
                        'profile_image' => $scout->profile_image,
                        'organization' => $scout->organization,
                        'position_title' => $scout->position_title,
                        'city' => $scout->city,
                        'country' => $scout->country,
                        'type' => 'scout',
                        'scout_id' => $scout->user_id
                    ];
                });

                $results = $players->concat($scouts);
            }

            // Get filter options for scouts
            $filterOptions = [];
            if ($userType === 'scout') {
                $scout = Scout::where('user_id', $user->id)->first();

                // Handle preferred roles safely
                $preferredRoles = [];
                if ($scout && $scout->preferred_roles) {
                    if (is_string($scout->preferred_roles)) {
                        try {
                            $preferredRoles = json_decode($scout->preferred_roles, true) ?? [];
                        } catch (\Exception $e) {
                            Log::warning('Failed to decode preferred roles:', ['error' => $e->getMessage()]);
                        }
                    } else if (is_array($scout->preferred_roles)) {
                        $preferredRoles = $scout->preferred_roles;
                    }
                }

                $filterOptions = [
                    'age_ranges' => [
                        ['label' => '15-18', 'value' => '15-18'],
                        ['label' => '19-23', 'value' => '19-23'],
                        ['label' => '24-30', 'value' => '24-30'],
                        ['label' => '31+', 'value' => '31+']
                    ],
                    'preferred_foot' => [
                        ['label' => 'Right', 'value' => 'right'],
                        ['label' => 'Left', 'value' => 'left'],
                        ['label' => 'Both', 'value' => 'both']
                    ],
                    'regions' => $this->getUniqueRegions(),
                    'transfer_status' => [
                        ['label' => 'Available', 'value' => 'available'],
                        ['label' => 'Not Available', 'value' => 'not_available'],
                        ['label' => 'Loan', 'value' => 'loan']
                    ],
                    'suggested_roles' => $preferredRoles
                ];
            }

            // Save search to recent searches
            if ($query) {
                $this->saveRecentSearch($user->id, $query);
            }

            Log::info('Search results:', [
                'count' => count($results),
                'filter_options' => $filterOptions
            ]);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'results' => $results,
                    'filter_options' => $filterOptions,
                    'recent_searches' => $this->getRecentSearches($user->id)
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Search error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred while performing the search',
                'debug_message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get unique regions from players
     */
    private function getUniqueRegions()
    {
        $regions = Player::distinct('current_city')
            ->pluck('current_city')
            ->filter()
            ->map(function($region) {
                return [
                    'label' => $region,
                    'value' => $region
                ];
            });

        return $regions;
    }

    /**
     * Save recent search
     */
    private function saveRecentSearch($userId, $query)
    {
        try {
            DB::table('recent_searches')->insert([
                'user_id' => $userId,
                'query' => $query,
                'created_at' => now()
            ]);

            // Keep only last 10 searches
            $recentSearches = DB::table('recent_searches')
                ->where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->get();

            if ($recentSearches->count() > 10) {
                DB::table('recent_searches')
                    ->where('user_id', $userId)
                    ->whereNotIn('id', $recentSearches->take(10)->pluck('id'))
                    ->delete();
            }
        } catch (\Exception $e) {
            // Log error but don't fail the search
            Log::error('Error saving recent search: ' . $e->getMessage());
        }
    }

    /**
     * Get recent searches
     */
    private function getRecentSearches($userId)
    {
        try {
            return DB::table('recent_searches')
                ->where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->pluck('query');
        } catch (\Exception $e) {
            // Log error and return empty array
            Log::error('Error getting recent searches: ' . $e->getMessage());
            return collect([]);
        }
    }

    /**
     * Like or unlike a post
     */
    public function toggleLike(Request $request)
    {
        $request->validate([
            'post_id' => 'required|exists:videos,id'
        ]);

        $user = Auth::user();
        $video = Video::findOrFail($request->post_id);

        $like = Like::where('user_id', $user->id)
                    ->where('post_id', $video->id)
                    ->first();

        if ($like) {
            $like->delete();
            $video->decrement('likes_count');
            $message = 'Video unliked successfully';
        } else {
            Like::create([
                'user_id' => $user->id,
                'post_id' => $video->id
            ]);
            $video->increment('likes_count');
            $message = 'Video liked successfully';
        }

        return response()->json([
            'status' => 'success',
            'message' => $message,
            'likes_count' => $video->likes_count
        ]);
    }

    /**
     * Follow or unfollow a user
     */
    public function toggleFollow(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id'
        ]);

        $follower = Auth::user();
        $userId = $request->user_id;

        // Prevent self-following
        if ($follower->id === $userId) {
            return response()->json([
                'status' => 'error',
                'message' => 'You cannot follow yourself'
            ], 400);
        }

        try {
            $follow = Follow::where('follower_id', $follower->id)
                           ->where('following_id', $userId)
                           ->first();

            if ($follow) {
                $follow->delete();
                $message = 'User unfollowed successfully';
                $following = false;
            } else {
                Follow::create([
                    'follower_id' => $follower->id,
                    'following_id' => $userId
                ]);
                $message = 'User followed successfully';
                $following = true;
            }

            return response()->json([
                'status' => 'success',
                'message' => $message,
                'following' => $following
            ]);
        } catch (\Exception $e) {
            Log::error('Toggle follow error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update follow status'
            ], 500);
        }
    }

    /**
     * Get events and ads
     */
    public function getEvents()
    {
        $user = Auth::user();
        $userType = $user->user_type;

        $events = Event::where('status', 'active')
            ->where(function ($query) use ($userType) {
                $query->where('target_audience', $userType)
                      ->orWhere('target_audience', 'all');
            })
            ->whereDate('end_date', '>=', now())
            ->orderBy('start_date')
            ->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $events
        ]);
    }

    /**
     * Filter videos in feed
     */
    public function filterVideos(Request $request)
    {
        $user = Auth::user();
        $query = Video::with([
            'user.player',
            'likes',
            'comments',
            'likes as user_liked' => function ($query) use ($user) {
                $query->where('user_id', $user->id);
            }
        ]);

        // Filter by video type
        if ($request->has('video_type')) {
            $query->where('video_type', $request->video_type);
        }

        // Filter by skill category
        if ($request->has('skill_category')) {
            $query->where('skill_category', $request->skill_category);
        }

        // Filter by duration
        if ($request->has('duration')) {
            switch ($request->duration) {
                case 'short':
                    $query->where('video_duration', '<=', 60); // Up to 1 minute
                    break;
                case 'medium':
                    $query->whereBetween('video_duration', [61, 300]); // 1-5 minutes
                    break;
                case 'long':
                    $query->where('video_duration', '>', 300); // Over 5 minutes
                    break;
            }
        }

        // Filter by date range
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Filter by player position
        if ($request->has('player_position')) {
            $query->whereHas('player', function ($q) use ($request) {
                $q->where('position', $request->player_position)
                  ->orWhere('secondary_position', $request->player_position);
            });
        }

        // Filter by popularity
        if ($request->has('sort_by')) {
            switch ($request->sort_by) {
                case 'most_liked':
                    $query->orderBy('likes_count', 'desc');
                    break;
                case 'most_viewed':
                    $query->orderBy('views_count', 'desc');
                    break;
                case 'most_recent':
                    $query->latest();
                    break;
                case 'trending':
                    $query->where('created_at', '>=', now()->subDays(7))
                          ->orderBy('likes_count', 'desc');
                    break;
            }
        } else {
            $query->latest();
        }

        // For scouts: Include premium content filter
        if ($user->user_type === 'scout') {
            if ($request->has('premium_only')) {
                $query->whereHas('player', function ($q) {
                    $q->where('membership', 'premium');
                });
            }
        }

        $videos = $query->paginate(10);

        // Transform videos to include user interaction data
        $videos->through(function ($post) use ($user) {
            $post->user_liked = !is_null($post->user_liked);
            $post->user_following = Follow::where('follower_id', $user->id)
                ->where('following_id', $post->player->user_id)
                ->exists();
            $post->time_ago = $post->created_at->diffForHumans();

            return $post;
        });

        return response()->json([
            'status' => 'success',
            'data' => [
                'videos' => $videos,
                'filters_applied' => $this->getAppliedFilters($request),
                'available_filters' => $this->getAvailableFilters($user->user_type)
            ]
        ]);
    }

    /**
     * Get list of filters that were applied
     */
    private function getAppliedFilters(Request $request)
    {
        $applied = [];
        $possibleFilters = [
            'video_type', 'skill_category', 'duration',
            'date_from', 'date_to', 'player_position',
            'sort_by', 'premium_only'
        ];

        foreach ($possibleFilters as $filter) {
            if ($request->has($filter)) {
                $applied[$filter] = $request->$filter;
            }
        }

        return $applied;
    }

    /**
     * Get available filters based on user type
     */
    private function getAvailableFilters($userType)
    {
        $filters = [
            'video_type' => ['match', 'training', 'skills', 'highlights'],
            'skill_category' => ['dribbling', 'shooting', 'passing', 'defending'],
            'duration' => ['short', 'medium', 'long'],
            'sort_by' => ['most_liked', 'most_viewed', 'most_recent', 'trending'],
            'player_position' => ['striker', 'midfielder', 'defender', 'goalkeeper']
        ];

        if ($userType === 'scout') {
            $filters['premium_only'] = [true, false];
        }

        return $filters;
    }

    /**
     * Get follow state for a user
     */
    private function getFollowState($userId)
    {
        $currentUser = Auth::user();
        return Follow::where('follower_id', $currentUser->id)
                    ->where('following_id', $userId)
                    ->exists();
    }

    public function calculateAge($DateofBirth)
   {
       if (!$DateofBirth) return null;
       $birthDate = new \DateTime($DateofBirth);
       $currentDate = new \DateTime();
     $age = $birthDate->diff($currentDate)->y;
     return $age;
 }

public function playerviewprofile($user_id) {
    // First find the user
    $user = User::where('id', $user_id)->where('user_type', 'player')->first();

    if (!$user) {
        return response()->json(['message' => 'User not found'], 404);
    }

    $player = Player::with('user')->where('user_id', $user_id)->first();

    if (!$player) {
        // Create a basic response with user data if player profile is not complete
        return response()->json([
            'data' => [
                'user_id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'username' => $user->username,
                'email' => $user->email,
            ],
            'age' => null,
            'videos' => []
        ]);
    }

    $age = $this->calculateAge($player->DateofBirth);
    $videos = Video::where('user_id', $user_id)
        ->with(['likes', 'comments'])
        ->get()
        ->map(function($video) {
            return [
                'id' => $video->id,
                'title' => $video->title,
                'description' => $video->description,
                'file_path' => $video->file_path,
                'thumbnail_url' => $video->thumbnail,
                'views' => $video->views,
                'likes_count' => $video->likes->count(),
                'comments_count' => $video->comments->count(),
                'created_at' => $video->created_at,
                'has_liked' => false // This will be updated in the frontend
            ];
        });

    $playerData = $player->toArray();
    $userData = $user->only(['first_name', 'last_name', 'username', 'email']);

    // Check if the authenticated user is following this player
    $isFollowing = false;
    $currentUser = Auth::user();
    if ($currentUser) {
        $isFollowing = Follow::where('follower_id', $currentUser->id)
            ->where('following_id', $user_id)
            ->exists();
    }

    return response()->json([
        'data' => array_merge($playerData, $userData),
        'age' => $age,
        'videos' => $videos,
        'following' => $isFollowing
    ]);
}

    public function scoutviewprofile($user_id) {
        $scoutprofiledata = Scout::with('user')->where('user_id', $user_id)->first();
        if (!$scoutprofiledata) {
            return response()->json([
                'message' => 'No scout profile found for this user'
            ], 404);
        }
        return response()->json([
            'data' => $scoutprofiledata
        ]);
    }

    public function getPremiumPlayers()
    {
        try {
            $premiumPlayers = Player::with('user')
                ->where('membership', 'premium')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($player) {
                    return [
                        'id' => $player->user->id,
                        'name' => $player->user->first_name . ' ' . $player->user->last_name,
                        'position' => $player->position,
                        'region' => $player->current_city,
                        'image' => $player->profile_image ? url('storage/' . $player->profile_image) : null,
                        'membership' => $player->membership,
                        'user_id' => $player->user_id
                    ];
                });

            return response()->json([
                'status' => 'success',
                'data' => $premiumPlayers
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching premium players: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch premium players'
            ], 500);
        }
    }
}
