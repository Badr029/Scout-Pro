<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, migrate any existing admin users to the new admins table
        $this->migrateAdminUsers();

        // Then modify the users table
        Schema::table('users', function (Blueprint $table) {
            // Change user_type enum to only include player and scout
            $table->enum('user_type', ['player', 'scout'])->change();

            // Add setup_completed if it doesn't exist
            if (!Schema::hasColumn('users', 'setup_completed')) {
                $table->boolean('setup_completed')->default(false)->after('password');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Restore original enum with admin
            $table->enum('user_type', ['admin', 'player', 'scout'])->change();
        });
    }

    /**
     * Migrate existing admin users to admins table
     */
    private function migrateAdminUsers(): void
    {
        // Get all admin users from the users table
        $adminUsers = \DB::table('users')->where('user_type', 'admin')->get();

        foreach ($adminUsers as $adminUser) {
            // Insert into admins table
            \DB::table('admins')->insert([
                'first_name' => $adminUser->first_name,
                'last_name' => $adminUser->last_name,
                'username' => $adminUser->username,
                'email' => $adminUser->email,
                'email_verified_at' => $adminUser->email_verified_at,
                'password' => $adminUser->password,
                'role' => 'admin',
                'is_active' => true,
                'created_at' => $adminUser->created_at,
                'updated_at' => $adminUser->updated_at,
            ]);
        }

        // Delete admin users from users table
        \DB::table('users')->where('user_type', 'admin')->delete();
    }
};
