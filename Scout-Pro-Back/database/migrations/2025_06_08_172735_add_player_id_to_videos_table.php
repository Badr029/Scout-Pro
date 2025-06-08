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
        Schema::table('videos', function (Blueprint $table) {
            // Add player_id column with foreign key constraint
            $table->foreignId('player_id')->nullable()->after('user_id')->constrained('players')->onDelete('cascade');

            // Add index for better performance
            $table->index(['player_id', 'created_at']);
            $table->index(['user_id', 'player_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->dropForeign(['player_id']);
            $table->dropIndex(['player_id', 'created_at']);
            $table->dropIndex(['user_id', 'player_id']);
            $table->dropColumn('player_id');
        });
    }
};
