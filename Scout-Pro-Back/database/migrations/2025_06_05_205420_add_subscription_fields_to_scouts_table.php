<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('scouts', function (Blueprint $table) {
            // Subscription and Registration Status
            $table->boolean('registration_completed')->default(false);
            $table->foreignId('subscription_id')->nullable()->constrained('subscriptions')->onDelete('set null');
            $table->boolean('subscription_active')->default(false);
            $table->timestamp('subscription_expires_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('scouts', function (Blueprint $table) {
            $table->dropColumn('registration_completed');
            $table->dropForeign(['subscription_id']);
            $table->dropColumn('subscription_id');
            $table->dropColumn('subscription_active');
            $table->dropColumn('subscription_expires_at');
        });
    }
};

