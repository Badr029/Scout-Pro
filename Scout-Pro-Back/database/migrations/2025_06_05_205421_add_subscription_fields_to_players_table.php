<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('players', function (Blueprint $table) {
            $table->foreignId('subscription_id')->nullable()->constrained('subscriptions')->onDelete('set null');
            $table->timestamp('subscription_expires_at')->nullable();
            $table->integer('monthly_video_count')->default(0);
            $table->timestamp('last_count_reset')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('players', function (Blueprint $table) {
            $table->dropForeign(['subscription_id']);
            $table->dropColumn('subscription_id');
            $table->dropColumn('subscription_expires_at');
            $table->dropColumn('monthly_video_count');
            $table->dropColumn('last_count_reset');
        });
    }
};
