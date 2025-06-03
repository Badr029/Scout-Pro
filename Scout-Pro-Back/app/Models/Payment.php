<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    public function subscription() {
    return $this->belongsTo(Subscription::class);
}

public function invoice() {
    return $this->hasOne(Invoice::class);
}
}