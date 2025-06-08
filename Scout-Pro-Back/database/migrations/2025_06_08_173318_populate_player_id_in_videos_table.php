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
        // Populate player_id for existing videos
        DB::statement("
            UPDATE videos
            SET player_id = (
                SELECT players.id
                FROM players
                WHERE players.user_id = videos.user_id
            )
            WHERE videos.player_id IS NULL
            AND videos.user_id IN (
                SELECT users.id
                FROM users
                WHERE users.user_type = 'player'
            )
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reset player_id to null
        DB::table('videos')->update(['player_id' => null]);
    }
};
