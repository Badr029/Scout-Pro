<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'amount',
        'card_number_encrypted' ,
        'card_last_four',
        'expiry',
        'cvv_encrypted',
        'cardholder_name',
    ];

   public function subscription()
{
    return $this->belongsTo(Subscription::class);
}

    public function invoice() {
        return $this->hasOne(Invoice::class);
    }

    public function invoices() {
        return $this->hasMany(Invoice::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
