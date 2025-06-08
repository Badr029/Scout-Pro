<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, populate accounts table with existing users
        $users = DB::table('users')->get();
        foreach ($users as $user) {
            // Skip users with no password (social login users)
            if (empty($user->password)) {
                continue;
            }

            $accountId = DB::table('accounts')->insertGetId([
                'email' => $user->email,
                'password' => $user->password,
                'role' => 'user',
                'is_active' => true,
                'created_at' => $user->created_at ?? now(),
                'updated_at' => $user->updated_at ?? now(),
            ]);

            // Update the user with the main_id
            DB::table('users')
                ->where('id', $user->id)
                ->update(['main_id' => $accountId]);
        }

        // Then, populate accounts table with existing admins
        $admins = DB::table('admins')->get();
        foreach ($admins as $admin) {
            $accountId = DB::table('accounts')->insertGetId([
                'email' => $admin->email,
                'password' => $admin->password,
                'role' => 'admin',
                'is_active' => $admin->is_active ?? true,
                'created_at' => $admin->created_at ?? now(),
                'updated_at' => $admin->updated_at ?? now(),
            ]);

            // Update the admin with the main_id
            DB::table('admins')
                ->where('id', $admin->id)
                ->update(['main_id' => $accountId]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Clear main_id from users and admins
        DB::table('users')->update(['main_id' => null]);
        DB::table('admins')->update(['main_id' => null]);

        // Clear accounts table
        DB::table('accounts')->truncate();
    }
};
