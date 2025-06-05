<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Scout extends Model
{
    protected $fillable = [
          // Basic Info
          'user_id',
          'profile_image',
          'username',
          'first_name',
          'last_name',
          'city',
          'country',
          'contact_email',
          'contact_phone',

          // Organization and Role Information
          'organization',
          'position_title',
          'scouting_regions',
          'age_groups',
          'preferred_roles',
          'clubs_worked_with',

          // Professional Information
          'linkedin_url',
          'id_proof_path',
          'certifications',

          // Subscription and Registration Status
          'registration_completed',
          'subscription_id',
          'subscription_active',
          'subscription_expires_at'
    ];

    protected $casts = [
        'scouting_regions' => 'array',
        'age_groups' => 'array',
        'preferred_roles' => 'array',
        'certifications' => 'array',
        'registration_completed' => 'boolean',
        'subscription_active' => 'boolean',
        'subscription_expires_at' => 'datetime'
    ];
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
