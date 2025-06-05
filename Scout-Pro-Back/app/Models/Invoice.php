<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'payment_id',
        'IssueDate',
        'Status'
    ];

    protected $casts = [
        'IssueDate' => 'datetime'
    ];

    /**
     * Get the payment associated with the invoice.
     */
    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }
}
