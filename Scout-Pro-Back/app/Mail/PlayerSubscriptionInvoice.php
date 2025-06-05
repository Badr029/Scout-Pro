<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PlayerSubscriptionInvoice extends Mailable
{
    use Queueable, SerializesModels;

    public $data;

    /**
     * Create a new message instance.
     */
    public function __construct(array $data)
    {
        $this->data = $data;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('Scout Pro - Player Membership Invoice')
                    ->view('emails.player-subscription-invoice')
                    ->with([
                        'player_name' => $this->data['player_name'],
                        'plan_name' => $this->data['plan_name'],
                        'amount' => $this->data['amount'],
                        'invoice_number' => $this->data['invoice_number'],
                        'invoice_date' => $this->data['invoice_date'],
                        'card_last_four' => $this->data['card_last_four'],
                        'expiry_date' => $this->data['expiry_date']
                    ]);
    }
}