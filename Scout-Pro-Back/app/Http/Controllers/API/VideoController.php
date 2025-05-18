<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class VideoController extends Controller
{
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
