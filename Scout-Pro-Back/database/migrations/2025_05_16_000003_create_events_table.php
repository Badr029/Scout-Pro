<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->enum('type', ['event', 'advertisement']);
            $table->timestamp('start_date');
            $table->timestamp('end_date');
            $table->string('location')->nullable();
            $table->enum('target_audience', ['player', 'scout', 'all']);
            $table->string('image_url')->nullable();
            $table->string('external_link')->nullable();
            $table->enum('status', ['active', 'inactive', 'completed'])->default('active');
            $table->foreignId('organizer_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('events');
    }
};
