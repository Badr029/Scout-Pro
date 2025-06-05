<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'user_type' => 'admin',
            'first_name' => 'Admin',
            'last_name' => 'User',
            'username' => 'admin',
            'email' => 'admin@scoutpro.com',
            'password' => Hash::make('admin123'),
            'setup_completed' => true,
            'email_verified_at' => now(),
        ]);
    }
}

