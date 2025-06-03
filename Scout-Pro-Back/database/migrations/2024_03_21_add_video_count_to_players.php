<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('players', function (Blueprint $table) {
            $table->integer('monthly_video_count')->default(0);
            $table->timestamp('last_count_reset')->nullable();
        });
    }

    public function down()
    {
        Schema::table('players', function (Blueprint $table) {
            $table->dropColumn('monthly_video_count');
            $table->dropColumn('last_count_reset');
        });
    }
}; 