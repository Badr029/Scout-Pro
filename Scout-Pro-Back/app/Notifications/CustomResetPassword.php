<?php
namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class CustomResetPassword extends ResetPassword
{
    /**
     * Build the reset password email.
     */
    public function toMail($notifiable)
    {
        // Use http://localhost:4200 for Angular development server
        $url = 'http://localhost:4200/reset-password?token=' . $this->token . '&email=' . urlencode($notifiable->getEmailForPasswordReset());

        return (new MailMessage)
            ->subject('Reset Password Notification')
            ->line('You are receiving this email because we received a password reset request for your account.')
            ->action('Reset Password', $url)
            ->line('If you did not request a password reset, no further action is required.');
    }
}



