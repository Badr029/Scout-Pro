<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
     use HasFactory;

    protected $primaryKey = 'plan_id';

    protected $fillable = [
        'Name',
        'Duration',
        'Price',
    ];

    // Relationships
    public function subscriptions()
    {
        return $this->hasMany(Subscription::class, 'plan_id', 'plan_id');
    }
}