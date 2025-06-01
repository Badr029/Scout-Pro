<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Video;
use App\Models\Comment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use App\Models\View;

class VideoController extends Controller
{
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
                        'player' => $playerInfo ? [
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

        // Check subscription limits
        $subscription = $user->subscription;
        $freeUploadLimit = 3; // Default monthly limit for free tier

        if (!$subscription || $subscription->plan === 'Free') {
            // Count this month's uploads
            $monthlyUploads = Video::where('user_id', $user->id)
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();

            if ($monthlyUploads >= $freeUploadLimit) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You have reached your monthly upload limit. Please upgrade to Premium for unlimited uploads.'
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

        // Handle file upload
        $file = $request->file('video');
        $filename = time() . '_' . $file->getClientOriginalName();
        $path = $file->storeAs('videos', $filename, 'public');

        // Generate thumbnail (would need FFmpeg in production)
        $thumbnailPath = 'thumbnails/' . time() . '_thumbnail.jpg';
        // In a real app, you'd use FFmpeg to generate a thumbnail from the video

        // Create video record
        $video = Video::create([
            'user_id' => $user->id,
            'title' => $request->title,
            'description' => $request->description,
            'file_path' => $path,
            'thumbnail' => $thumbnailPath,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Video uploaded successfully',
            'data' => $video
        ]);
    }

    /**
     * Display the specified video.
     */
    public function show(Video $video)
    {
        // Increment view count
        $video->views++;
        $video->save();

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

        // Load the user relationship for the response
        $like->load('user.player');

        return response()->json([
            'status' => 'success',
            'message' => 'Video liked successfully',
            'data' => [
                'like' => [
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
                ],
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
     * Add a comment to a video.
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

        // Load the user with their player relationship
        $comment->load(['user.player']);

        // Format the response data
        $responseData = [
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

        return response()->json([
            'status' => 'success',
            'message' => 'Comment added successfully',
            'data' => $responseData
        ]);
    }

    /**
     * Upload a new video
     */
    public function upload(Request $request)
    {
        // Check if user is a player
        $user = Auth::user();
        if ($user->user_type !== 'player') {
            return response()->json([
                'status' => 'error',
                'message' => 'Only players can upload videos'
            ], 403);
        }

        // Validate the request
        $request->validate([
            'video' => 'required|mimetypes:video/mp4,video/quicktime|max:100000', // 100MB max
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'video_category' => 'required|string|in:match_highlights,training_session,skills_showcase,match_analysis,tactical_review',
            'skill_category' => 'required|string|in:dribbling,shooting,passing,defending,goalkeeping,fitness',
            'thumbnail' => 'nullable|image|max:2048', // 2MB max
        ]);

        try {
            // Store video
            $videoPath = $request->file('video')->store('videos/players/' . $user->id, 'public');

            // Get video duration (requires FFmpeg)
            $duration = $this->getVideoDuration(Storage::disk('public')->path($videoPath));

            // Store thumbnail if provided, or generate from video
            $thumbnailPath = null;
            if ($request->hasFile('thumbnail')) {
                $thumbnailPath = $request->file('thumbnail')->store('thumbnails/players/' . $user->id, 'public');
            } else {
                // Generate thumbnail from video (requires FFmpeg)
                $thumbnailPath = $this->generateThumbnail($videoPath, $user->id);
            }

            // Create post
            $post = Post::create([
                'player_id' => $user->player->id,
                'title' => $request->title,
                'description' => $request->description,
                'video_url' => Storage::url($videoPath),
                'thumbnail_url' => $thumbnailPath ? Storage::url($thumbnailPath) : null,
                'video_category' => $request->video_category,
                'skill_category' => $request->skill_category,
                'video_duration' => $duration,
                'likes_count' => 0,
                'comments_count' => 0,
                'views_count' => 0,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Video uploaded successfully',
                'data' => $post
            ]);

        } catch (\Exception $e) {
            // Clean up any uploaded files if there was an error
            if (isset($videoPath)) {
                Storage::disk('public')->delete($videoPath);
            }
            if (isset($thumbnailPath)) {
                Storage::disk('public')->delete($thumbnailPath);
            }

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
            $thumbnailPath = 'thumbnails/' . $userId;
            $thumbnailFullPath = storage_path('app/public/' . $thumbnailPath);

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

            // Generate thumbnail with improved command formatting
            // Note: Removed single quotes around filter and using double quotes for Windows compatibility
            $ffmpegCommand = sprintf('ffmpeg -i %s -ss %s -vframes 1 -vf "scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2:color=black" -y %s 2>&1',
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
            return null;
        }
    }

    /**
     * Get videos for a specific player
     */
    public function getPlayerVideos($playerId)
    {
        $videos = Post::where('player_id', $playerId)
            ->whereNotNull('video_url')
            ->with(['player.user'])
            ->latest()
            ->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $videos
        ]);
    }

    /**
     * Handle chunk upload
     */
    public function uploadChunk(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'player' && $user->user_type !== 'player') {
            return response()->json([
                'status' => 'error',
                'message' => 'Only players can upload videos'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'video' => 'required|file',
            'chunkIndex' => 'required|integer',
            'totalChunks' => 'required|integer',
            'fileName' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $chunkIndex = $request->chunkIndex;
        $fileName = $request->fileName;
        $tempPath = storage_path('app/temp/' . $user->id);

        if (!file_exists($tempPath)) {
            mkdir($tempPath, 0777, true);
        }

        $chunk = $request->file('video');
        $chunk->move($tempPath, $fileName . '.part' . $chunkIndex);

        return response()->json([
            'status' => 'success',
            'message' => 'Chunk uploaded successfully'
        ]);
    }

    /**
     * Finalize chunk upload
     */
    public function finalizeUpload(Request $request)
    {
        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'fileName' => 'required|string',
            'totalChunks' => 'required|integer',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $fileName = $request->fileName;
        $totalChunks = $request->totalChunks;
        $tempPath = storage_path('app/temp/' . $user->id);
        $finalPath = 'videos/' . $user->id;
        $finalStoragePath = storage_path('app/public/' . $finalPath);

        if (!file_exists($finalStoragePath)) {
            mkdir($finalStoragePath, 0777, true);
        }

        $finalFileName = time() . '_' . $fileName;
        $finalFilePath = $finalPath . '/' . $finalFileName;
        $finalFullPath = storage_path('app/public/' . $finalFilePath);
        $finalFile = fopen($finalFullPath, 'wb');

        // Combine all chunks
        for ($i = 0; $i < $totalChunks; $i++) {
            $chunkFile = $tempPath . '/' . $fileName . '.part' . $i;
            if (!file_exists($chunkFile)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Missing chunk file'
                ], 400);
            }

            $chunk = file_get_contents($chunkFile);
            fwrite($finalFile, $chunk);
            unlink($chunkFile); // Delete chunk after combining
        }

        fclose($finalFile);

        // Clean up temp directory
        if (file_exists($tempPath)) {
            rmdir($tempPath);
        }

        // Get the count of existing videos for this user
        $videoCount = Video::where('user_id', $user->id)->count();

        // Create video record in database
        $video = new Video();
        $video->user_id = $user->id;

        // Handle title
        if (!empty($request->title)) {
            $video->title = $request->title;
        } else {
            $video->title = 'Video ' . ($videoCount + 1);
        }

        // Handle description
        $video->description = $request->description ?? '';
        $video->file_path = $finalFilePath;

        // Generate thumbnail from video frame
        $thumbnailPath = $this->generateThumbnail($finalFilePath, $user->id);
        $video->thumbnail = $thumbnailPath;

        $video->views = 0;
        $video->save();

        // Return the video with proper URLs
        $video->url = url('storage/' . $video->file_path);
        $video->thumbnail_url = $thumbnailPath ? url('storage/' . $video->thumbnail) : null;

        return response()->json([
            'status' => 'success',
            'message' => 'Video upload completed',
            'data' => $video
        ]);
    }

    /**
     * Increment video views.
     */
    public function view(Video $video)
    {
        $user = Auth::user();

        // Check if user has already viewed this video in the last 24 hours
        $recentView = View::where('user_id', $user->id)
            ->where('video_id', $video->id)
            ->where('viewed_at', '>=', now()->subHours(24))
            ->first();

        if (!$recentView) {
            // Create new view record
            View::create([
                'user_id' => $user->id,
                'video_id' => $video->id,
                'viewed_at' => now()
            ]);

            // Increment video views
            $video->increment('views');
        }

        return response()->json([
            'status' => 'success',
            'message' => 'View recorded successfully',
            'data' => [
                'views' => $video->views
            ]
        ]);
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
                    'role' => $like->user->user_type === 'scout' ? $like->user->scout->role : null,
                    'following' => false
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

                // Check if the current user is following this user
                $userData['following'] = $user->following()->where('following_id', $like->user->id)->exists();

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
}
