<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Player extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'profile_image',
        'username',
        'first_name',
        'last_name',
        'DateofBirth',
        'phone_number',
        'height',
        'weight',
        'preferred_foot',
        'position',
        'secondary_position',
        'gender',
        'nationality',
        'current_city',
        'current_club',
        'previous_clubs',
        'playing_style',
        'transfer_status',
        'bio',
        'membership',
        // 'personal_id_photo_path',
    ];

    protected $casts = [
        'DateofBirth' => 'date',
        'secondary_position' => 'array',
        'previous_clubs' => 'array'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    public function videos()
    {
        return $this->hasMany(Video::class);
    }

    public function followers()
    {
        return $this->hasManyThrough(
            Follow::class,
            User::class,
            'id', // Local key on users table
            'following_id', // Foreign key on follows table
            'user_id', // Local key on players table
            'id' // Foreign key on users table
        );
    }

    public function getAge()
    {
        return $this->DateofBirth ? now()->diffInYears($this->DateofBirth) : null;
    }

    public function getTotalViews()
    {
        return $this->videos()->sum('views');
    }

    public function getTotalLikes()
    {
        return $this->posts()->sum('likes_count');
    }

    public function getEngagementRate()
    {
        $totalViews = $this->getTotalViews();
        $totalEngagements = $this->getTotalLikes() + $this->posts()->sum('comments_count');

        if ($totalViews > 0) {
            return round($totalEngagements / $totalViews * 100, 2);
        }
        return 0;
    }

    public function getVideoCategories()
    {
        return $this->videos()
            ->distinct()
            ->pluck('video_category')
            ->filter();
    }

    public function getSkillCategories()
    {
        return $this->videos()
            ->distinct()
            ->pluck('skill_category')
            ->filter();
    }

    public function getMostViewedVideo()
    {
        return $this->videos()
            ->orderBy('views_count', 'desc')
            ->first();
    }

    public function getRecentVideos($limit = 5)
    {
        return $this->videos()
            ->latest()
            ->limit($limit)
            ->get();
    }

    public function getPopularVideos($limit = 5)
    {
        return $this->videos()
            ->orderBy('views_count', 'desc')
            ->limit($limit)
            ->get();
    }
}
