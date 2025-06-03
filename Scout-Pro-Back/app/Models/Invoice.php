<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


class Invoice extends Model
{
    protected $primaryKey = 'invoice_id';

    protected $fillable = [
        'payment_id',
        'IssueDate',
        'Status'
    ];

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }
}