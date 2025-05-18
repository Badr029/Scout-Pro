<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'player_id',
        'title',
        'description',
        'video_url',
        'video_category',
        'video_duration',
        'likes_count',
        'comments_count',
        'views_count',
        'skill_category',
    ];

    protected $casts = [
        'video_duration' => 'integer',
        'likes_count' => 'integer',
        'comments_count' => 'integer',
        'views_count' => 'integer',
    ];

    public function player()
    {
        return $this->belongsTo(Player::class);
    }

    public function likes()
    {
        return $this->hasMany(Like::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function views()
    {
        return $this->hasMany(View::class);
    }

    public function isLikedByUser($userId)
    {
        return $this->likes()->where('user_id', $userId)->exists();
    }

    public function incrementViews($userId)
    {
        $this->views()->firstOrCreate([
            'user_id' => $userId,
            'viewed_at' => now()
        ]);
        $this->increment('views_count');
    }

    public function getEngagementRate()
    {
        if ($this->views_count > 0) {
            return round(($this->likes_count + $this->comments_count) / $this->views_count * 100, 2);
        }
        return 0;
    }
}
