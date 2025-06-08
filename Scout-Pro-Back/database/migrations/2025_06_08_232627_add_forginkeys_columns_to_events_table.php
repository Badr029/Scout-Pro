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
        Schema::table('events', function (Blueprint $table) {
            $table->foreignId('scout_organizer_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->foreignId('admin_organizer_id')->nullable()->constrained('admins')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropForeign(['scout_organizer_id']);
            $table->dropForeign(['admin_organizer_id']);
            $table->dropColumn(['scout_organizer_id', 'admin_organizer_id']);
        });
    }
};
