<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Event extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'description',
        'date',
        'location',
        'latitude',
        'longitude',
        'image',
        'organizer_id',
        'organizer_type',
        'organizer_contact',
        'target_audience',
        'status',
        'rejection_reason',
        'responded_at'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'date' => 'datetime',
        'responded_at' => 'datetime'
    ];

    /**
     * Get the organizer of the event (polymorphic relationship).
     */
    public function organizer()
    {
        return $this->morphTo();
    }
    public function scoutOrganizer()
    {
        return $this->belongsTo(Scout::class, 'scout_organizer_id');
    }
    public function adminOrganizer()
    {
        return $this->belongsTo(Admin::class, 'admin_organizer_id');
    }

    /**
     * Get the organizer with their scout profile.
     */
    public function organizerWithProfile()
    {
        return $this->organizer()->with(['scout' => function($query) {
            $query->select('id', 'user_id', 'profile_image', 'organization', 'scouting_regions');
        }]);
    }
}
