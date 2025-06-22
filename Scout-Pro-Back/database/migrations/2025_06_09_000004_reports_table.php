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
        // Drop the existing separate report tables
        Schema::dropIfExists('bug_reports');
        Schema::dropIfExists('user_reports');
        Schema::dropIfExists('video_reports');
        Schema::dropIfExists('reports');

        // Create the consolidated reports table
        Schema::create('reports', function (Blueprint $table) {
            $table->id();

            // Common fields
            $table->enum('report_type', ['video', 'user', 'bug']);
            $table->foreignId('reporter_id')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['pending', 'in_review', 'resolved', 'rejected'])->default('pending');
            $table->text('admin_notes')->nullable();
            $table->timestamp('resolved_at')->nullable();

            // Video report fields
            $table->foreignId('video_id')->nullable()->constrained('videos')->onDelete('cascade');
            $table->enum('video_reason', [
                'inappropriate_content',
                'copyright_violation',
                'spam',
                'offensive_behavior',
                'other'
            ])->nullable();

            // User report fields
            $table->foreignId('reported_user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->enum('user_reason', [
                'harassment',
                'fake_profile',
                'inappropriate_behavior',
                'spam',
                'bullying',
                'hate_speech',
                'scam_fraud',
                'impersonation',
                'other'
            ])->nullable();

            // Bug report fields
            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->nullable()->default('medium');
            $table->string('page_url')->nullable();
            $table->json('browser_info')->nullable();

            // Common description field for all report types
            $table->text('description');

            $table->timestamps();

            // Add indexes for better performance
            $table->index(['report_type', 'status']);
            $table->index(['reporter_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');

        // Recreate the original tables
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->enum('report_type', ['video', 'user', 'bug']);
            $table->foreignId('reporter_id')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['pending', 'in_review', 'resolved', 'rejected'])->default('pending');
            $table->text('admin_notes')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });

        Schema::create('video_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained('reports')->onDelete('cascade');
            $table->foreignId('video_id')->constrained('videos')->onDelete('cascade');
            $table->enum('reason', [
                'inappropriate_content',
                'copyright_violation',
                'spam',
                'offensive_behavior',
                'other'
            ]);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('user_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained('reports')->onDelete('cascade');
            $table->foreignId('reported_user_id')->constrained('users')->onDelete('cascade');
            $table->enum('reason', [
                'harassment',
                'fake_profile',
                'inappropriate_behavior',
                'spam',
                'bullying',
                'hate_speech',
                'scam_fraud',
                'impersonation',
                'other'
            ]);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('bug_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained('reports')->onDelete('cascade');
            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->string('page_url')->nullable();
            $table->text('description');
            $table->json('browser_info')->nullable();
            $table->timestamps();
        });
    }
};
