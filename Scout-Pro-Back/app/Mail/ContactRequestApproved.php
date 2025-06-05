<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ContactRequestApproved extends Mailable
{
    use Queueable, SerializesModels;

    public $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function build()
    {
        return $this->subject('Contact Request Approved - Scout Pro')
            ->markdown('emails.contact-request-approved')
            ->with([
                'scout_name' => $this->data['scout_name'],
                'player_name' => $this->data['player_name'],
                'player_email' => $this->data['player_email'],
                'player_phone' => $this->data['player_phone'],
                'message' => $this->data['message']
            ]);
    }
}
