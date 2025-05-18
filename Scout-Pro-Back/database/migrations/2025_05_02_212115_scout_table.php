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

        Schema::create('scouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('profile_image')->nullable();
            $table->string('username')->nullable();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('city');
            $table->string('country');
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();

            // Organization and Role Information
            $table->string('organization')->nullable();
            $table->string('position_title')->nullable();
            $table->json('scouting_regions')->nullable();
            $table->json('age_groups')->nullable();
            $table->json('preferred_roles')->nullable();
            $table->text('clubs_worked_with')->nullable();

            // Professional Information
            $table->string('linkedin_url')->nullable();
            $table->string('id_proof_path')->nullable();
            $table->json('certifications')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scouts');
    }
};
