<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Video extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'file_path',
        'thumbnail',
        'views',
        'status'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'views' => 'integer',
    ];

    /**
     * Append these attributes to array/JSON representations.
     *
     * @var array
     */
    protected $appends = [
        'likes_count',
        'comments_count'
    ];

    /**
     * Get the user that owns the video.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
   
    /**
     * Get the comments for the video.
     */
    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * Get the likes for the video.
     */
    public function likes()
    {
        return $this->hasMany(Like::class);
    }

    /**
     * Get the number of likes for the video.
     */
    public function getLikesCountAttribute()
    {
        return $this->likes()->count();
    }

    /**
     * Get the number of comments for the video.
     */
    public function getCommentsCountAttribute()
    {
        return $this->comments()->count();
    }
}
