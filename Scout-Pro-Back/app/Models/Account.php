<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Account extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The primary key for the model.
     */
    protected $primaryKey = 'main_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'email',
        'password',
        'role',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the user associated with this account (if role is 'user')
     */
    public function user()
    {
        return $this->hasOne(User::class, 'main_id', 'main_id');
    }

    /**
     * Get the admin associated with this account (if role is 'admin')
     */
    public function admin()
    {
        return $this->hasOne(Admin::class, 'main_id', 'main_id');
    }

    /**
     * Check if account is for admin
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if account is for user
     */
    public function isUser(): bool
    {
        return $this->role === 'user';
    }

    /**
     * Check if account is active
     */
    public function isActive(): bool
    {
        return $this->is_active;
    }
}
