<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Account;
use App\Models\User;
use App\Models\Admin;
use Illuminate\Support\Facades\DB;

class AccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * This seeder populates accounts table from existing users and admins
     * Use this ONLY if accounts table is empty and you need to sync existing data
     */
    public function run(): void
    {
        // Check if accounts table is already populated
        if (Account::count() > 0) {
            echo "Accounts table already has data. Skipping...\n";
            return;
        }

        echo "Populating accounts table from existing users and admins...\n";

        // Populate from users
        $users = User::whereNotNull('password')->get();
        foreach ($users as $user) {
            $account = Account::create([
                'email' => $user->email,
                'password' => $user->password,
                'role' => 'user',
                'is_active' => true,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ]);

            // Update user with main_id
            $user->update(['main_id' => $account->main_id]);
            echo "Synced user: {$user->email} with account ID: {$account->main_id}\n";
        }

        // Populate from admins
        $admins = Admin::all();
        foreach ($admins as $admin) {
            $account = Account::create([
                'email' => $admin->email,
                'password' => $admin->password,
                'role' => 'admin',
                'is_active' => $admin->is_active,
                'created_at' => $admin->created_at,
                'updated_at' => $admin->updated_at,
            ]);

            // Update admin with main_id
            $admin->update(['main_id' => $account->main_id]);
            echo "Synced admin: {$admin->email} with account ID: {$account->main_id}\n";
        }

        echo "Account synchronization complete!\n";
    }
}
