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
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('main_id')->nullable()->after('id');
            $table->foreign('main_id')->references('main_id')->on('accounts')->onDelete('cascade');
        });

        Schema::table('admins', function (Blueprint $table) {
            $table->unsignedBigInteger('main_id')->nullable()->after('id');
            $table->foreign('main_id')->references('main_id')->on('accounts')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['main_id']);
            $table->dropColumn('main_id');
        });

        Schema::table('admins', function (Blueprint $table) {
            $table->dropForeign(['main_id']);
            $table->dropColumn('main_id');
        });
    }
};
