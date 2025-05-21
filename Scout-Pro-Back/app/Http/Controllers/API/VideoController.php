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
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

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

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        } else {
            $query->where('user_id', $user->id);
        }

        $videos = $query->with(['user', 'comments', 'likes'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

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
        if ($user->role !== 'player') {
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
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
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

        // Load relationships
        $video->load(['user', 'comments.user', 'likes']);

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
        if ($video->likes()->where('user_id', $user->id)->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'You have already liked this video'
            ], 400);
        }

        // Add like
        $video->likes()->create([
            'user_id' => $user->id
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Video liked successfully'
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
            'message' => 'Video unliked successfully'
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

        $comment->load('user');

        return response()->json([
            'status' => 'success',
            'message' => 'Comment added successfully',
            'data' => $comment
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
    public function delete(Request $request, $id)
    {
        $user = Auth::user();
        $post = Post::findOrFail($id);

        // Check if user owns the video
        if ($user->player->id !== $post->player_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized to delete this video'
            ], 403);
        }

        try {
            // Delete video file
            $videoPath = str_replace('/storage/', '', parse_url($post->video_url, PHP_URL_PATH));
            Storage::disk('public')->delete($videoPath);

            // Delete thumbnail if exists
            if ($post->thumbnail_url) {
                $thumbnailPath = str_replace('/storage/', '', parse_url($post->thumbnail_url, PHP_URL_PATH));
                Storage::disk('public')->delete($thumbnailPath);
            }

            // Delete post
            $post->delete();

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
        $thumbnailPath = 'thumbnails/players/' . $userId . '/' . Str::random(40) . '.jpg';
        $fullThumbnailPath = Storage::disk('public')->path($thumbnailPath);

        // Create directory if it doesn't exist
        if (!file_exists(dirname($fullThumbnailPath))) {
            mkdir(dirname($fullThumbnailPath), 0755, true);
        }

        // Generate thumbnail from middle of video
        $command = "ffmpeg -i " . escapeshellarg(Storage::disk('public')->path($videoPath)) .
                  " -ss 00:00:01 -vframes 1 " . escapeshellarg($fullThumbnailPath);
        shell_exec($command);

        return $thumbnailPath;
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
}
