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
    ];

    protected $casts = [
        'scouting_regions' => 'array',
        'age_groups' => 'array',
        'preferred_roles' => 'array',
        'certifications' => 'array',
    ];
}
