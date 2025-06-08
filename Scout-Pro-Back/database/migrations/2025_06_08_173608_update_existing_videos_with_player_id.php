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
        // Update existing videos to set player_id based on user_id
        DB::statement("
            UPDATE videos
            SET player_id = (
                SELECT players.id
                FROM players
                WHERE players.user_id = videos.user_id
                LIMIT 1
            )
            WHERE player_id IS NULL
            AND user_id IN (
                SELECT users.id
                FROM users
                WHERE users.user_type = 'player'
            )
        ");

        echo "Updated existing videos with player_id based on user relationships.\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Set all player_id to null (reversal)
        DB::table('videos')->update(['player_id' => null]);

        echo "Reverted player_id updates in videos table.\n";
    }
};
