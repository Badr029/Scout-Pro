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
        Schema::create('players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('profile_image')->nullable();
            $table->string('username')->nullable();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->date('DateofBirth');
            $table->string('phone_number', 15);
            $table->integer('height');
            $table->integer('weight');
            $table->string('preferred_foot');
            $table->string('position');
            $table->json('secondary_position')->nullable();
            $table->enum('gender', ['male', 'female']);
            $table->string('nationality');
            $table->string('current_city');
            $table->string('current_club');
            $table->json('previous_clubs')->nullable(); // NEW
            $table->string('playing_style')->nullable(); // NEW
            $table->string('transfer_status')->nullable(); // NEW
            $table->text('bio')->nullable();
            $table->enum('membership', ['free', 'premium'])->default('free');
            // $table->string('personal_id_photo_path')->nullable(); // Optional file
            $table->timestamps();
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('players');

    }
};
