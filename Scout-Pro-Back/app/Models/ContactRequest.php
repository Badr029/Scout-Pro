<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactRequest extends Model
{
    protected $fillable = [
        'scout_id',
        'player_id',
        'status',
        'message',
        'responded_at'
    ];

    protected $casts = [
        'responded_at' => 'datetime'
    ];

    public function scout(): BelongsTo
    {
        return $this->belongsTo(User::class, 'scout_id');
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(User::class, 'player_id');
    }
}
