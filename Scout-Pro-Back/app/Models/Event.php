<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'type', // 'event' or 'advertisement'
        'start_date',
        'end_date',
        'location',
        'target_audience', // 'player', 'scout', 'all'
        'image_url',
        'external_link',
        'status', // 'active', 'inactive', 'completed'
        'organizer_id', // reference to user who created the event
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function organizer()
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }
}
