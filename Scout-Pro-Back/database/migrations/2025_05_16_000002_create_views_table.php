<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('post_id')->constrained()->onDelete('cascade');
            $table->timestamp('viewed_at');
            $table->integer('watch_duration')->nullable();
            $table->timestamps();

            // A user can view a post multiple times, but we'll track each view separately
            $table->index(['user_id', 'post_id', 'viewed_at']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('views');
    }
};
