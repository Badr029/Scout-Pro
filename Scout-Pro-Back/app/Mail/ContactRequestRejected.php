<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ContactRequestRejected extends Mailable
{
    use Queueable, SerializesModels;

    public $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function build()
    {
        return $this->subject('Contact Request Status Update - Scout Pro')
            ->markdown('emails.contact-request-rejected')
            ->with([
                'scout_name' => $this->data['scout_name'],
                'player_name' => $this->data['player_name'],
                'message' => $this->data['message']
            ]);
    }
}
