<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
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
}
