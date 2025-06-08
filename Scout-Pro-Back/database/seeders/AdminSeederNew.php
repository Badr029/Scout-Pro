<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Admin;
use App\Models\Account;
use Illuminate\Support\Facades\Hash;

class AdminSeederNew extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admins = [
            [
                'email' => 'badr.admin@scoutpro.com',
                'password' => Hash::make('admin123'),
                'role' => 'super_admin',
                'is_active' => true,
            ],
            [
                'email' => 'mariam.admin@scoutpro.com',
                'password' => Hash::make('admin123'),
                'role' => 'manager',
                'is_active' => true,
            ],
            [
                'email' => 'menna.admin@scoutpro.com',
                'password' => Hash::make('admin123'),
                'role' => 'moderator',
                'is_active' => true,
            ],
            [
                'email' => 'youssef.admin@scoutpro.com',
                'password' => Hash::make('admin123'),
                'role' => 'moderator',
                'is_active' => true,
            ],
            [
                'email' => 'shahd.admin@scoutpro.com',
                'password' => Hash::make('admin123'),
                'role' => 'moderator',
                'is_active' => true,
            ],
            [
                'email' => 'romisaa.admin@scoutpro.com',
                'password' => Hash::make('admin123'),
                'role' => 'moderator',
                'is_active' => true,
            ],
        ];

        foreach ($admins as $adminData) {
            // First create the account entry
            $account = Account::create([
                'email' => $adminData['email'],
                'password' => $adminData['password'],
                'role' => 'admin',
                'is_active' => $adminData['is_active'],
            ]);

            // Then create the admin with the main_id
            $adminData['main_id'] = $account->main_id;
            Admin::create($adminData);

            echo "Created admin: " . $adminData['email'] . " (" . $adminData['role'] . ") with account ID: " . $account->main_id . "\n";
        }
    }
}
