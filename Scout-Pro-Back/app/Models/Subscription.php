<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'plan_id',
        'payment_id',
        'active',
        'plan',
        'trial_ends_at',
        'expires_at',
        'canceled_at'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'active' => 'boolean',
        'trial_ends_at' => 'datetime',
        'expires_at' => 'datetime',
        'canceled_at' => 'datetime',
    ];

    /**
     * Get the user that owns the subscription.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }


public function plan()
{
    return $this->belongsTo(Plan::class, 'plan_id');
}

public function payment()
{
    return $this->belongsTo(Payment::class, 'payment_id');
}
}
