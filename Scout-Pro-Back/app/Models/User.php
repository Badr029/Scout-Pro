<?php

namespace App\Models;
use App\Notifications\CustomResetPassword;
use App\Notifications\CustomVerifyEmail;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'first_name',
        'last_name',
        'username',
        'user_type',
        'email',
        'password',
        'social_id',
        'provider',
        'email_verified_at',
        'setup_completed'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'setup_completed' => 'boolean'
    ];

    public function sendPasswordResetNotification($token)
    {
        $this->notify(new CustomResetPassword($token));
    }

    /**
     * Send the email verification notification.
     *
     * @return void
     */
    public function sendEmailVerificationNotification()
    {
        $this->notify(new CustomVerifyEmail);
    }

    public function player()
    {
        return $this->hasOne(Player::class);
    }

    public function scout()
    {
        return $this->hasOne(Scout::class);
    }

    public function hasCompletedSetup(): bool
    {
        if ($this->user_type === 'player') {
            return $this->player()->exists();
        } else if ($this->user_type === 'scout') {
            return $this->scout()->exists();
        }
        return false;
    }
}
