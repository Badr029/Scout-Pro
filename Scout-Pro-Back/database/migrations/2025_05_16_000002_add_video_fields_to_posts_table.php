<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->string('video_category')->nullable();
            $table->integer('video_duration')->nullable();
            $table->integer('views_count')->default(0);
            $table->string('skill_category')->nullable();
            $table->index(['video_category', 'skill_category']);
            $table->index('views_count');
        });
    }

    public function down()
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn(['video_category', 'video_duration', 'views_count', 'skill_category']);
            $table->dropIndex(['video_category', 'skill_category']);
            $table->dropIndex('views_count');
        });
    }
};
