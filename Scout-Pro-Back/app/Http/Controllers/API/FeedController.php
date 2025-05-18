<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Like;
use App\Models\Follow;
use App\Models\Event;
use App\Models\Player;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Builder;

class FeedController extends Controller
{
    /**
     * Get the main feed based on user type with video filters by player profile
     */
    public function index(Request $request)
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
        $query = Player::query()->with('user');

        if ($user->user_type === 'scout') {
            // Full search capabilities for scouts
            if ($request->has('position')) {
                $query->where('position', $request->position)
                      ->orWhere('secondary_position', $request->position);
            }

            if ($request->has('region')) {
                $query->where('current_city', 'LIKE', "%{$request->region}%");
            }

            if ($request->has('playing_style')) {
                $query->where('playing_style', $request->playing_style);
            }

            if ($request->has('preferred_foot')) {
                $query->where('preferred_foot', $request->preferred_foot);
            }

            // Filter by age range
            if ($request->has('min_age') || $request->has('max_age')) {
                $now = now();

                if ($request->has('min_age')) {
                    $maxDate = $now->subYears($request->min_age)->format('Y-m-d');
                    $query->whereDate('DateofBirth', '<=', $maxDate);
                }

                if ($request->has('max_age')) {
                    $now = now(); // Reset date
                    $minDate = $now->subYears($request->max_age)->format('Y-m-d');
                    $query->whereDate('DateofBirth', '>=', $minDate);
                }
            }

            // Filter by transfer status
            if ($request->has('transfer_status')) {
                if ($request->transfer_status === 'free') {
                    $query->where('transfer_status', 'available')
                          ->where(function ($q) {
                              $q->whereNull('current_club')
                                ->orWhere('current_club', '');
                          });
                } else {
                    $query->where('transfer_status', $request->transfer_status);
                }
            }

            // Order by premium status first for scouts
            $query->orderByDesc(function ($query) {
                $query->select('membership')
                      ->from('players')
                      ->whereColumn('players.id', 'players.id')
                      ->where('membership', 'premium');
            });

        } else {
            // Limited search capabilities for players
            if ($request->has('position')) {
                $query->where('position', $request->position)
                      ->orWhere('secondary_position', $request->position);
            }

            // Search by name for players
            if ($request->has('search')) {
                $search = $request->search;
                $query->whereHas('user', function (Builder $query) use ($search) {
                    $query->where('first_name', 'LIKE', "%{$search}%")
                          ->orWhere('last_name', 'LIKE', "%{$search}%");
                });
            }
        }

        // Common ordering
        $query->latest();

        $players = $query->paginate(10);

        // Add age calculation only for scouts
        if ($user->user_type === 'scout') {
            $players->through(function ($player) {
                if ($player->DateofBirth) {
                    $player->age = now()->diffInYears($player->DateofBirth);
                }
                return $player;
            });
        }

        return response()->json([
            'status' => 'success',
            'data' => $players
        ]);
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
