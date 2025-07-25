<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Models\Comment;
use App\Models\User;
use App\Models\Like;
use App\Models\View;
use App\Models\Follow;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Traits\NotificationHelper;

class VideoController extends Controller
{
    use NotificationHelper;

    /**
     * Display a listing of the user's videos.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Get user's videos or filter by user ID if provided
        $query = Video::query();

        // If accessed from profile page, only show current user's videos
        if ($request->header('X-Profile-Page') === 'true') {
            $query->where('user_id', $user->id);
        } else if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $videos = $query->with(['user.player', 'likes.user.player', 'comments.user.player'])
            ->withCount('likes')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($video) use ($user) {
                // Get player info from the user's player relation
                $playerInfo = $video->user->player ?? null;

                // Check if current user has liked this video
                $hasLiked = $video->likes->contains(function ($like) use ($user) {
                    return $like->user_id === $user->id;
                });

                // Add following status to the video owner
                if ($video->user) {
                    $isFollowing = Follow::where('follower_id', $user->id)
                        ->where('following_id', $video->user->id)
                        ->exists();
                    $video->user->is_following = $isFollowing;
                    $video->user->following = $isFollowing;
                }

                return [
                    'id' => $video->id,
                    'title' => $video->title,
                    'description' => $video->description,
                    'file_path' => $video->file_path,
                    'thumbnail' => $video->thumbnail,
                    'views' => $video->views,
                    'likes_count' => $video->likes_count,
                    'comments_count' => $video->comments->count(),
                    'has_liked' => $hasLiked,
                    'likes' => $video->likes->map(function ($like) {
                        return [
                            'id' => $like->id,
                            'user' => [
                                'id' => $like->user->id,
                                'first_name' => $like->user->first_name,
                                'last_name' => $like->user->last_name,
                                'full_name' => $like->user->first_name . ' ' . $like->user->last_name,
                                'profile_image' => $like->user->player ? url('storage/' . $like->user->player->profile_image) : null,
                                'player' => $like->user->player ? [
                                    'position' => $like->user->player->position,
                                    'nationality' => $like->user->player->nationality,
                                ] : null
                            ]
                        ];
                    }),
                    'comments' => $video->comments->map(function ($comment) {
                        return [
                            'id' => $comment->id,
                            'content' => $comment->content,
                            'created_at' => $comment->created_at,
                            'user_id' => $comment->user_id,
                            'user' => [
                                'id' => $comment->user->id,
                                'first_name' => $comment->user->first_name,
                                'last_name' => $comment->user->last_name,
                                'profile_image' => $comment->user->player ? url('storage/' . $comment->user->player->profile_image) : null,
                                'full_name' => $comment->user->first_name . ' ' . $comment->user->last_name
                            ]
                        ];
                    }),
                    'created_at' => $video->created_at,
                    'user' => [
                        'id' => $video->user->id,
                        'first_name' => $video->user->first_name,
                        'last_name' => $video->user->last_name,
                        'full_name' => $video->user->first_name . ' ' . $video->user->last_name,
                        'user_type' => $video->user->user_type,
                        'profile_image' => $playerInfo ? url('storage/' . $playerInfo->profile_image) : null,
                        'membership' => $playerInfo ? $playerInfo->membership : 'free',
                        'following' => Follow::where('follower_id', $user->id)
                            ->where('following_id', $video->user->id)
                            ->exists(),
                        'player' => $playerInfo ? [
                            'id' => $playerInfo->id,
                            'position' => $playerInfo->position,
                            'secondary_position' => $playerInfo->secondary_position,
                            'nationality' => $playerInfo->nationality,
                            'region' => $playerInfo->current_city,
                            'age' => $playerInfo->getAge(),
                            'height' => $playerInfo->height,
                            'weight' => $playerInfo->weight,
                            'preferred_foot' => $playerInfo->preferred_foot,
                            'transfer_status' => $playerInfo->transfer_status
                        ] : null
                    ]
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $videos
        ]);
    }

    /**
     * Store a newly created video in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Check if user is a player
        if ($user->role !== 'player' && $user->user_type !== 'player') {
            return response()->json([
                'status' => 'error',
                'message' => 'Only players can upload videos'
            ], 403);
        }

        $player = $user->player;

        // Check membership limits
        if ($player->membership === 'free') {
            // Reset count if it's a new month
            if (!$player->last_count_reset ||
                now()->startOfMonth()->gt($player->last_count_reset)) {
                $player->monthly_video_count = 0;
                $player->last_count_reset = now()->startOfMonth();
                $player->save();
            }

            // Check if player has reached monthly limit
            if ($player->monthly_video_count >= 2) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You have reached your monthly upload limit of 2 videos. Please upgrade to Premium for unlimited uploads.',
                    'remaining_uploads' => 0,
                    'monthly_video_count' => $player->monthly_video_count
                ], 403);
            }
        }

        // Validate request
        $validator = Validator::make($request->all(), [
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'video' => 'required|file|mimetypes:video/mp4,video/quicktime,video/x-ms-wmv|max:100000' // 100MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Generate auto title if none provided
            $title = $request->title;
            if (empty($title)) {
                // Get the count of user's videos and add 1
                $videoCount = Video::where('user_id', $user->id)->count() + 1;
                $title = "Video " . $videoCount;
            }

            // Store video
            $file = $request->file('video');
            $filename = time() . '_' . $file->getClientOriginalName();
            $videoPath = $file->storeAs('videos/players/' . $user->id, $filename, 'public');

            // Generate thumbnail
            $thumbnailPath = null;
            if ($request->hasFile('thumbnail')) {
                $thumbnailFile = $request->file('thumbnail');
                $thumbnailName = time() . '_thumbnail_' . $thumbnailFile->getClientOriginalName();
                $thumbnailPath = $thumbnailFile->storeAs('thumbnails/players/' . $user->id, $thumbnailName, 'public');
            } else {
                // Generate thumbnail from video
                $thumbnailPath = $this->generateThumbnail($videoPath, $user->id);
            }

            // Create video record
            $video = Video::create([
                'user_id' => $user->id,
                'player_id' => $player->id,
                'title' => $title,
                'description' => $request->description ?? '',
                'file_path' => $videoPath,
                'thumbnail' => $thumbnailPath,
                'views' => 0
            ]);

            // Increment monthly video count for free users
            if ($player->membership === 'free') {
                $player->increment('monthly_video_count');
                $player->save();
            }

            // Get the fresh count after increment
            $player->refresh();

            // Load the video with its relationships
            $video->load(['user.player', 'likes', 'comments']);

            // Add URLs for frontend
            $video->url = url('storage/' . $video->file_path);
            $video->thumbnail_url = url('storage/' . $video->thumbnail);

            return response()->json([
                'status' => 'success',
                'message' => 'Video uploaded successfully',
                'data' => [
                    'video' => $video,
                    'remaining_uploads' => $player->membership === 'free' ? max(0, 2 - $player->monthly_video_count) : null,
                    'monthly_video_count' => $player->monthly_video_count
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Video upload error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to upload video: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified video.
     */
    public function show(Video $video)
    {
        $user = Auth::user();

        // Record the view if the user hasn't viewed this video in the last 24 hours
        $lastView = View::where('user_id', $user->id)
            ->where('video_id', $video->id)
            ->where('viewed_at', '>=', now()->subHours(24))
            ->first();

        if (!$lastView) {
            View::create([
                'user_id' => $user->id,
                'video_id' => $video->id,
                'viewed_at' => now()
            ]);

            // Update the video's view count
            $video->increment('views');
        }

        // Load relationships and add URLs
        $video->load(['user.player', 'comments.user', 'likes']);
        $video->url = url('storage/' . $video->file_path);
        $video->thumbnail_url = url('storage/' . $video->thumbnail);

        return response()->json([
            'status' => 'success',
            'data' => $video
        ]);
    }

    /**
     * Record a video view.
     */
    public function recordView(Video $video)
    {
        $user = Auth::user();

        // Check if the user has viewed this video in the last 24 hours
        $lastView = View::where('user_id', $user->id)
            ->where('video_id', $video->id)
            ->where('viewed_at', '>=', now()->subHours(24))
            ->first();

        if (!$lastView) {
            View::create([
                'user_id' => $user->id,
                'video_id' => $video->id,
                'viewed_at' => now()
            ]);

            // Update the video's view count
            $video->increment('views');

            return response()->json([
                'status' => 'success',
                'message' => 'View recorded successfully',
                'data' => [
                    'views' => $video->views
                ]
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'View already recorded',
            'data' => [
                'views' => $video->views
            ]
        ]);
    }

    /**
     * Like a video.
     */
    public function like(Video $video)
    {
        $user = Auth::user();

        // Check if already liked
        $existingLike = $video->likes()->where('user_id', $user->id)->first();
        if ($existingLike) {
            // If already liked, unlike it
            $existingLike->delete();

            // Delete any existing like notifications
            Notification::where('user_id', $video->user_id)
                ->where('actor_id', $user->id)
                ->where('type', 'like')
                ->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Video unliked successfully',
                'data' => [
                    'likes_count' => $video->fresh()->likes()->count(),
                    'has_liked' => false
                ]
            ]);
        }

        // Add like
        $like = $video->likes()->create([
            'user_id' => $user->id
        ]);

        // Create notification for video owner if it's not their own video
        // and if they are a premium player (handled in NotificationHelper)
        if ($video->user_id !== $user->id) {
            $this->createLikeNotification($user, User::find($video->user_id), 'video');
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Video liked successfully',
            'data' => [
                'likes_count' => $video->fresh()->likes()->count(),
                'has_liked' => true
            ]
        ]);
    }

    /**
     * Unlike a video.
     */
    public function unlike(Video $video)
    {
        $user = Auth::user();

        // Remove like
        $video->likes()->where('user_id', $user->id)->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Video unliked successfully',
            'data' => [
                'likes_count' => $video->fresh()->likes()->count(),
                'has_liked' => false
            ]
        ]);
    }

    /**
     * Get comments for a video
     */
    public function getComments(Video $video)
    {
        $comments = $video->comments()
            ->with(['user.player'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'content' => $comment->content,
                    'created_at' => $comment->created_at,
                    'user' => [
                        'id' => $comment->user->id,
                        'first_name' => $comment->user->first_name,
                        'last_name' => $comment->user->last_name,
                        'profile_image' => $comment->user->player ? $comment->user->player->profile_image : null,
                    ]
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $comments
        ]);
    }

    /**
     * Get like status for a video
     */
    public function getLikeStatus(Video $video)
    {
        $user = Auth::user();
        $hasLiked = $video->likes()->where('user_id', $user->id)->exists();
        $likesCount = $video->likes()->count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'has_liked' => $hasLiked,
                'likes_count' => $likesCount
            ]
        ]);
    }

    /**
     * Add a comment to a video
     */
    public function comment(Request $request, Video $video)
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        $comment = $video->comments()->create([
            'user_id' => $user->id,
            'content' => $request->content
        ]);

        // Create notification for video owner if it's not their own comment
        // and if they are a premium player (handled in NotificationHelper)
        if ($video->user_id !== $user->id) {
            $this->createCommentNotification($user, User::find($video->user_id));
        }

        // Load the user relationship for the response
        $comment->load('user.player');

        return response()->json([
            'status' => 'success',
            'data' => [
            'id' => $comment->id,
            'content' => $comment->content,
            'created_at' => $comment->created_at,
            'user' => [
                'id' => $comment->user->id,
                'first_name' => $comment->user->first_name,
                'last_name' => $comment->user->last_name,
                    'profile_image' => $comment->user->player ? $comment->user->player->profile_image : null,
            ]
            ]
        ]);
    }

    /**
     * Upload a new video
     */
    public function upload(Request $request)
    {
        $user = Auth::user();

        // Check if user is a player
        if ($user->role !== 'player' && $user->user_type !== 'player') {
            return response()->json([
                'status' => 'error',
                'message' => 'Only players can upload videos'
            ], 403);
        }

        $player = $user->player;

        // Check membership limits
        if ($player->membership === 'free') {
            // Reset count if it's a new month
            if (!$player->last_count_reset ||
                now()->startOfMonth()->gt($player->last_count_reset)) {
                $player->monthly_video_count = 0;
                $player->last_count_reset = now()->startOfMonth();
                $player->save();
            }

            // Check if player has reached monthly limit
            if ($player->monthly_video_count >= 2) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You have reached your monthly upload limit of 2 videos. Please upgrade to Premium for unlimited uploads.',
                    'remaining_uploads' => 0,
                    'monthly_video_count' => $player->monthly_video_count
                ], 403);
            }
        }

        // Validate request
        $validator = Validator::make($request->all(), [
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'video' => 'required|file|mimetypes:video/mp4,video/quicktime,video/x-ms-wmv|max:100000' // 100MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Generate auto title if none provided
            $title = $request->title;
            if (empty($title)) {
                // Get the count of user's videos and add 1
                $videoCount = Video::where('user_id', $user->id)->count() + 1;
                $title = "Video " . $videoCount;
            }

            // Store video
            $videoPath = $request->file('video')->store('videos/players/' . $user->id, 'public');

            // Store thumbnail if provided, or generate from video
            $thumbnailPath = null;
            if ($request->hasFile('thumbnail')) {
                $thumbnailPath = $request->file('thumbnail')->store('thumbnails/players/' . $user->id, 'public');
            } else {
                // Generate thumbnail from video (requires FFmpeg)
                $thumbnailPath = $this->generateThumbnail($videoPath, $user->id);
            }

            // Create video record
            $video = Video::create([
                'user_id' => $user->id,
                'player_id' => $player->id,
                'title' => $title,
                'description' => $request->description ?? '',
                'file_path' => $videoPath,
                'thumbnail' => $thumbnailPath,
                'views' => 0
            ]);

            // Increment monthly video count for free users
            if ($player->membership === 'free') {
                $player->increment('monthly_video_count');
                $player->save();
            }

            // Get the fresh count after increment
            $player->refresh();

            // Load the video with its relationships
            $video->load(['user.player', 'likes', 'comments']);

            // Add URLs for frontend
            $video->url = url('storage/' . $video->file_path);
            $video->thumbnail_url = url('storage/' . $video->thumbnail);

            return response()->json([
                'status' => 'success',
                'message' => 'Video uploaded successfully',
                'data' => [
                    'video' => $video,
                    'remaining_uploads' => $player->membership === 'free' ? max(0, 2 - $player->monthly_video_count) : null,
                    'monthly_video_count' => $player->monthly_video_count
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Video upload error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to upload video: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a video
     */
    public function delete($id)
    {
        $user = Auth::user();
        $video = Video::findOrFail($id);

        // Check if user owns the video
        if ($user->id !== $video->user_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized to delete this video'
            ], 403);
        }

        try {
            // Delete video file
            if ($video->file_path) {
                Storage::disk('public')->delete($video->file_path);
            }

            // Delete thumbnail
            if ($video->thumbnail) {
                Storage::disk('public')->delete($video->thumbnail);
            }

            // Delete video record
            $video->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Video deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete video: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get video duration using FFmpeg
     */
    private function getVideoDuration($videoPath)
    {
        $command = "ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 " . escapeshellarg($videoPath);
        $duration = shell_exec($command);
        return (int) $duration;
    }

    /**
     * Generate thumbnail from video using FFmpeg
     */
    private function generateThumbnail($videoPath, $userId)
    {
        try {
            $thumbnailFileName = time() . '_thumbnail.jpg';
            $thumbnailPath = 'thumbnails/players/' . $userId;
            $thumbnailFullPath = storage_path('app/public/' . $thumbnailPath);

            // Create thumbnails directory if it doesn't exist
            if (!file_exists($thumbnailFullPath)) {
                mkdir($thumbnailFullPath, 0777, true);
            }

            $thumbnailFullPath = $thumbnailFullPath . '/' . $thumbnailFileName;
            $videoFullPath = storage_path('app/public/' . $videoPath);

            // Get video duration using ffprobe
            $durationCmd = "ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 " . escapeshellarg($videoFullPath);
            $duration = shell_exec($durationCmd);

            if ($duration === null) {
                Log::error('Failed to get video duration using ffprobe');
                throw new \Exception('Failed to get video duration');
            }

            $duration = (float)$duration;

            // Generate thumbnail from middle of video or at 3 seconds, whichever is earlier
            $timestamp = min(3, $duration / 2);

            // Format timestamp for ffmpeg (HH:MM:SS.mmm)
            $timestampFormatted = sprintf('%02d:%02d:%02d.000',
                floor($timestamp / 3600),
                floor(($timestamp % 3600) / 60),
                floor($timestamp % 60)
            );

            // Generate high-quality thumbnail with improved settings
            $ffmpegCommand = sprintf('ffmpeg -i %s -ss %s -vframes 1 -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black" -q:v 2 -y %s 2>&1',
                escapeshellarg($videoFullPath),
                $timestampFormatted,
                escapeshellarg($thumbnailFullPath)
            );

            // Execute the command and capture output
            $output = shell_exec($ffmpegCommand);

            // Verify the thumbnail was created and is a valid image
            if (!file_exists($thumbnailFullPath) || filesize($thumbnailFullPath) === 0) {
                Log::error('Failed to generate thumbnail. FFmpeg output: ' . $output);
                throw new \Exception('Failed to generate thumbnail');
            }

            // Verify the thumbnail is a valid image
            if (!@getimagesize($thumbnailFullPath)) {
                Log::error('Generated thumbnail is not a valid image. FFmpeg output: ' . $output);
                unlink($thumbnailFullPath); // Delete the invalid file
                throw new \Exception('Generated thumbnail is not a valid image');
            }

            return $thumbnailPath . '/' . $thumbnailFileName;
        } catch (\Exception $e) {
            Log::error('Thumbnail generation failed: ' . $e->getMessage());
            Log::error('FFmpeg command (if available): ' . ($ffmpegCommand ?? 'N/A'));
            Log::error('FFmpeg output (if available): ' . ($output ?? 'N/A'));

            // Return a default thumbnail path or null
            return null;
        }
    }

    /**
     * Get likes for a video.
     */
    public function getLikes(Video $video)
    {
        $user = Auth::user();

        // Load likes with user and player relationships
        $likes = $video->likes()
            ->with(['user.player', 'user.scout'])
            ->get()
            ->map(function ($like) use ($user) {
                $userData = [
                    'id' => $like->user->id,
                    'first_name' => $like->user->first_name,
                    'last_name' => $like->user->last_name,
                    'full_name' => $like->user->first_name . ' ' . $like->user->last_name,
                    'profile_image' => null,
                    'user_type' => $like->user->user_type,
                    'role' => $like->user->user_type === 'scout' ? $like->user->scout->role : null
                ];

                // Set profile image based on user type
                if ($like->user->user_type === 'player' && $like->user->player) {
                    $userData['profile_image'] = $like->user->player->profile_image ? url('storage/' . $like->user->player->profile_image) : null;
                    $userData['player'] = [
                        'position' => $like->user->player->position,
                        'nationality' => $like->user->player->nationality,
                    ];
                } elseif ($like->user->user_type === 'scout' && $like->user->scout) {
                    $userData['profile_image'] = $like->user->scout->profile_image ? url('storage/' . $like->user->scout->profile_image) : null;
                }

                return [
                    'id' => $like->id,
                    'user' => $userData
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $likes
        ]);
    }

    /**
     * Delete a comment from a video
     */
    public function deleteComment($videoId, $commentId)
    {
        $user = Auth::user();

        // Find the comment
        $comment = DB::table('comments')
            ->where('id', $commentId)
            ->where('video_id', $videoId)
            ->first();

        if (!$comment) {
            return response()->json([
                'status' => 'error',
                'message' => 'Comment not found'
            ], 404);
        }

        // Check if user owns the comment
        if ($comment->user_id !== $user->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized to delete this comment'
            ], 403);
        }

        // Delete the comment
        DB::table('comments')
            ->where('id', $commentId)
            ->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Comment deleted successfully'
        ]);
    }
}
