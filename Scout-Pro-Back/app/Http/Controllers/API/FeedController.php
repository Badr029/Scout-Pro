<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Like;
use App\Models\Follow;
use App\Models\Event;
use App\Models\Player;
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
        if ($userType === 'scout' && $position) {
            $videosQuery->whereHas('user.player', function ($query) use ($position) {
                $query->where('position', $position);
            });
        }

        if ($userType === 'scout' && $secondary_position) {
            $videosQuery->whereHas('user.player', function ($query) use ($secondary_position) {
                $query->where('secondary_position', $secondary_position);
            });
        }

        if ($userType === 'scout' && $region) {
            $videosQuery->whereHas('user.player', function ($query) use ($region) {
                $query->where('nationality', 'like', '%' . $region . '%')
                    ->orWhere('current_city', 'like', '%' . $region . '%');
            });
        }

        if ($userType === 'scout' && $preferred_foot) {
            $videosQuery->whereHas('user.player', function ($query) use ($preferred_foot) {
                $query->where('preferred_foot', $preferred_foot);
            });
        }

        if ($userType === 'scout' && $playing_style) {
            $videosQuery->whereHas('user.player', function ($query) use ($playing_style) {
                $query->where('playing_style', $playing_style);
            });
        }

        if ($userType === 'scout' && $transfer_status) {
            $videosQuery->whereHas('user.player', function ($query) use ($transfer_status) {
                $query->where('transfer_status', $transfer_status);
            });
        }

        // Get videos with pagination
        $videos = $videosQuery->paginate(10);

        // Transform the videos to include user-specific data
        $videos->through(function ($video) use ($user) {
            // Add has_liked flag
            $video->has_liked = $video->likes->where('user_id', $user->id)->count() > 0;

            // Format the likes data
            $video->likes_data = $video->likes->map(function ($like) {
                return [
                    'id' => $like->id,
                    'user_id' => $like->user_id,
                    'user' => [
                        'id' => $like->user->id,
                        'first_name' => $like->user->first_name,
                        'last_name' => $like->user->last_name,
                        'profile_image' => $like->user->player ? $like->user->player->profile_image : null
                    ]
                ];
            });

            // Format the comments data
            $video->comments_data = $video->comments->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'content' => $comment->content,
                    'created_at' => $comment->created_at,
                    'user_id' => $comment->user_id,
                    'user' => [
                        'id' => $comment->user->id,
                        'first_name' => $comment->user->first_name,
                        'last_name' => $comment->user->last_name,
                        'profile_image' => $comment->user->player ? $comment->user->player->profile_image : null
                    ]
                ];
            });

            // Add user data with proper profile image path
            if ($video->user && $video->user->player) {
                $video->user->profile_image = $video->user->player->profile_image;
            }

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
                    'region' => $user->player ? $user->player->nationality : null,
                    'image' => $user->player && $user->player->profile_image
                        ? url('storage/' . $user->player->profile_image)
                        : null,
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
                        'region' => $user->player ? $user->player->nationality : null,
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
     * Get the main feed based on user type with video filters by player profile
     */
    public function indexOld(Request $request)
    {
        $user = Auth::user();
        $query = Post::with([
            'player.user',
            'likes',
            'comments',
            'likes as user_liked' => function ($query) use ($user) {
                $query->where('user_id', $user->id);
            }
        ])->whereNotNull('video_url');

        // Filter feed by player attributes
        if ($request->has('position')) {
            $query->whereHas('player', function ($q) use ($request) {
                $q->where('position', $request->position)
                  ->orWhere('secondary_position', $request->position);
            });
        }

        if ($request->has('playing_style')) {
            $query->whereHas('player', function ($q) use ($request) {
                $q->where('playing_style', $request->playing_style);
            });
        }

        if ($request->has('preferred_foot')) {
            $query->whereHas('player', function ($q) use ($request) {
                $q->where('preferred_foot', $request->preferred_foot);
            });
        }

        // Age range filter
        if ($request->has('min_age') || $request->has('max_age')) {
            $query->whereHas('player', function ($q) use ($request) {
                if ($request->has('min_age')) {
                    $maxDate = now()->subYears($request->min_age)->format('Y-m-d');
                    $q->whereDate('DateofBirth', '<=', $maxDate);
                }
                if ($request->has('max_age')) {
                    $minDate = now()->subYears($request->max_age)->format('Y-m-d');
                    $q->whereDate('DateofBirth', '>=', $minDate);
                }
            });
        }

        // Region/City filter
        if ($request->has('region')) {
            $query->whereHas('player', function ($q) use ($request) {
                $q->where('current_city', 'LIKE', "%{$request->region}%");
            });
        }

        // Add video category filter
        if ($request->has('video_category')) {
            $query->where('video_category', $request->video_category);
        }

        // Add engagement level filter
        if ($request->has('engagement')) {
            switch ($request->engagement) {
                case 'high':
                    $query->where('likes_count', '>=', 100);
                    break;
                case 'medium':
                    $query->whereBetween('likes_count', [20, 99]);
                    break;
                case 'low':
                    $query->where('likes_count', '<', 20);
                    break;
            }
        }

        // For scouts: Show posts from followed players first
        if ($user->user_type === 'scout') {
            $followingIds = Follow::where('follower_id', $user->id)
                ->pluck('following_id');

            // Get scout's most viewed positions
            $mostViewedPositions = Post::whereHas('views', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->join('players', 'posts.player_id', '=', 'players.id')
            ->groupBy('players.position')
            ->orderByRaw('COUNT(*) DESC')
            ->limit(3)
            ->pluck('players.position');

            // Enhanced ordering for scouts
            $query->orderByRaw("CASE
                WHEN player_id IN (
                    SELECT id FROM players WHERE membership = 'premium'
                ) THEN 1
                WHEN player_id IN (
                    SELECT id FROM players WHERE user_id IN (" . $followingIds->implode(',') . ")
                ) THEN 2
                WHEN player_id IN (
                    SELECT id FROM players WHERE position IN ('" . $mostViewedPositions->implode("','") . "')
                ) THEN 3
                ELSE 4
                END")
                ->orderBy('created_at', 'desc');

        } else {
            // For players: Enhanced similar player matching
            $playerProfile = $user->player;
            if ($playerProfile) {
                $query->orderByRaw("CASE
                    WHEN player_id IN (
                        SELECT id FROM players
                        WHERE (position = ? OR secondary_position = ?)
                        AND playing_style = ?
                        AND preferred_foot = ?
                    ) THEN 1
                    WHEN player_id IN (
                        SELECT id FROM players
                        WHERE position = ?
                        OR current_city = ?
                    ) THEN 2
                    ELSE 3
                    END", [
                        $playerProfile->position,
                        $playerProfile->position,
                        $playerProfile->playing_style,
                        $playerProfile->preferred_foot,
                        $playerProfile->position,
                        $playerProfile->current_city
                    ])
                    ->orderBy('created_at', 'desc');
            }
        }

        $posts = $query->paginate(10);

        // Enhanced trending players with performance metrics
        $trendingPlayers = Player::select('players.*')
            ->join('posts', 'players.id', '=', 'posts.player_id')
            ->whereNotNull('posts.video_url')
            ->withCount(['posts' => function ($query) {
                $query->whereNotNull('video_url');
            }])
            ->withCount('likes')
            ->withCount('views')
            ->withAvg('posts', 'likes_count')
            ->orderBy('views_count', 'desc')
            ->orderBy('likes_count', 'desc')
            ->limit(5)
            ->get();

        // Get upcoming events
        $upcomingEvents = Event::where('status', 'active')
            ->where(function ($query) use ($user) {
                $query->where('target_audience', $user->user_type)
                    ->orWhere('target_audience', 'all');
            })
            ->whereDate('start_date', '>=', now())
            ->whereDate('start_date', '<=', now()->addDays(7))
            ->orderBy('start_date')
            ->limit(3)
            ->get();

        // Transform posts with enhanced data
        $posts->through(function ($post) use ($user) {
            $post->user_liked = !is_null($post->user_liked);
            $post->user_following = Follow::where('follower_id', $user->id)
                ->where('following_id', $post->player->user_id)
                ->exists();
            $post->time_ago = $post->created_at->diffForHumans();

            // Enhanced player details
            $post->player_details = [
                'position' => $post->player->position,
                'playing_style' => $post->player->playing_style,
                'preferred_foot' => $post->player->preferred_foot,
                'age' => $post->player->DateofBirth ? now()->diffInYears($post->player->DateofBirth) : null,
                'current_city' => $post->player->current_city,
                'engagement_rate' => $this->calculateEngagementRate($post),
                'performance_level' => $this->getPerformanceLevel($post)
            ];

            // Add video analytics
            $post->video_analytics = [
                'views_count' => $post->views_count,
                'likes_count' => $post->likes_count,
                'comments_count' => $post->comments_count,
                'engagement_rate' => ($post->views_count > 0) ?
                    round(($post->likes_count + $post->comments_count) / $post->views_count * 100, 2) : 0,
                'watch_time' => $this->getAverageWatchTime($post->id)
            ];

            return $post;
        });

        // Enhanced filter options
        $filterOptions = [
            'positions' => Player::distinct()->pluck('position')->filter(),
            'playing_styles' => Player::distinct()->pluck('playing_style')->filter(),
            'preferred_feet' => Player::distinct()->pluck('preferred_foot')->filter(),
            'regions' => Player::distinct()->pluck('current_city')->filter(),
            'video_categories' => [
                'match_highlights',
                'training_session',
                'skills_showcase',
                'match_analysis',
                'tactical_review'
            ],
            'engagement_levels' => [
                'high' => '100+ likes',
                'medium' => '20-99 likes',
                'low' => '<20 likes'
            ]
        ];

        // Get personalized recommendations
        $recommendations = $this->getPersonalizedRecommendations($user);

        return response()->json([
            'status' => 'success',
            'data' => [
                'posts' => $posts,
                'trending_players' => $trendingPlayers,
                'upcoming_events' => $upcomingEvents,
                'filter_options' => $filterOptions,
                'applied_filters' => array_intersect_key($request->all(), array_flip([
                    'position', 'playing_style', 'preferred_foot', 'region',
                    'min_age', 'max_age', 'video_category', 'engagement'
                ])),
                'recommendations' => $recommendations,
                'user_type' => $user->user_type
            ]
        ]);
    }

    /**
     * Calculate engagement rate for a post
     */
    private function calculateEngagementRate($post)
    {
        if ($post->views_count > 0) {
            return round(($post->likes_count + $post->comments_count) / $post->views_count * 100, 2);
        }
        return 0;
    }

    /**
     * Get performance level based on engagement
     */
    private function getPerformanceLevel($post)
    {
        $engagementRate = $this->calculateEngagementRate($post);
        if ($engagementRate >= 15) return 'High';
        if ($engagementRate >= 5) return 'Medium';
        return 'Low';
    }

    /**
     * Get average watch time for a video
     */
    private function getAverageWatchTime($postId)
    {
        // Implement video watch time tracking logic
        // This is a placeholder returning random value between 0-100%
        return rand(0, 100);
    }

    /**
     * Get personalized recommendations based on user behavior
     */
    private function getPersonalizedRecommendations($user)
    {
        if ($user->user_type === 'scout') {
            // For scouts: recommend based on most viewed positions and regions
            return Player::whereHas('posts', function ($query) {
                $query->whereNotNull('video_url');
            })
            ->where('membership', 'premium')
            ->whereDoesntHave('followers', function ($query) use ($user) {
                $query->where('follower_id', $user->id);
            })
            ->inRandomOrder()
            ->limit(5)
            ->get();
        } else {
            // For players: recommend similar players
            $player = $user->player;
            return Player::where('position', $player->position)
                ->where('id', '!=', $player->id)
                ->whereHas('posts', function ($query) {
                    $query->whereNotNull('video_url');
                })
                ->inRandomOrder()
                ->limit(5)
                ->get();
        }
    }

    /**
     * Search and filter players based on user type
     */
    public function search(Request $request)
    {
        $user = Auth::user();
        $query = $request->get('query', '');
        $filters = $request->get('filters', []);

        // Search in players table
        $playersQuery = Player::select('players.*')
            ->join('users', 'players.user_id', '=', 'users.id')
            ->where(function($q) use ($query) {
                $q->where('players.first_name', 'LIKE', "%{$query}%")
                  ->orWhere('players.last_name', 'LIKE', "%{$query}%")
                  ->orWhere('players.position', 'LIKE', "%{$query}%");
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

        // Apply filters for players if user is a scout
        if ($user->user_type === 'scout' && !empty($filters)) {
            if (!empty($filters['age_range'])) {
                $ages = explode('-', $filters['age_range']);
                if (count($ages) === 2) {
                    $minDate = now()->subYears($ages[1])->format('Y-m-d');
                    $maxDate = now()->subYears($ages[0])->format('Y-m-d');
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

            if (!empty($filters['transfer_status'])) {
                $playersQuery->where('players.transfer_status', $filters['transfer_status']);
            }
        }

        // Get results
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
                'type' => 'scout'
            ];
        });

        // Merge results
        $results = $players->concat($scouts);

        // Get filter options for scouts
        $filterOptions = [];
        if ($user->user_type === 'scout') {
            $scout = Scout::where('user_id', $user->id)->first();

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
                'suggested_roles' => $scout ? json_decode($scout->preferred_roles) : []
            ];
        }

        // Save search to recent searches
        if ($query) {
            $this->saveRecentSearch($user->id, $query);
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'results' => $results,
                'filter_options' => $filterOptions,
                'recent_searches' => $this->getRecentSearches($user->id)
            ]
        ]);
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
            'post_id' => 'required|exists:posts,id'
        ]);

        $user = Auth::user();
        $post = Post::findOrFail($request->post_id);

        $like = Like::where('user_id', $user->id)
                    ->where('post_id', $post->id)
                    ->first();

        if ($like) {
            $like->delete();
            $post->decrement('likes_count');
            $message = 'Post unliked successfully';
        } else {
            Like::create([
                'user_id' => $user->id,
                'post_id' => $post->id
            ]);
            $post->increment('likes_count');
            $message = 'Post liked successfully';
        }

        return response()->json([
            'status' => 'success',
            'message' => $message,
            'likes_count' => $post->likes_count
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

        // Prevent self-following
        if ($follower->id === $request->user_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'You cannot follow yourself'
            ], 400);
        }

        $follow = Follow::where('follower_id', $follower->id)
                       ->where('following_id', $request->user_id)
                       ->first();

        if ($follow) {
            $follow->delete();
            $message = 'User unfollowed successfully';
        } else {
            Follow::create([
                'follower_id' => $follower->id,
                'following_id' => $request->user_id
            ]);
            $message = 'User followed successfully';
        }

        return response()->json([
            'status' => 'success',
            'message' => $message
        ]);
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
        $query = Post::with([
            'player.user',
            'likes',
            'comments',
            'likes as user_liked' => function ($query) use ($user) {
                $query->where('user_id', $user->id);
            }
        ])->whereNotNull('video_url'); // Only get posts with videos

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
}

