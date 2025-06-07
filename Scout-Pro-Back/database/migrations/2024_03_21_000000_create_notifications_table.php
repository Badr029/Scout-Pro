<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateNotificationsTable extends Migration
{
    public function up()
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('type'); // 'follow', 'contact_request', 'like', 'comment', 'event', 'subscription'
            $table->foreignId('actor_id')->nullable()->constrained('users')->onDelete('cascade'); // who triggered the notification
            $table->text('message');
            $table->json('data')->nullable(); // Additional data specific to notification type
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('notifications');
    }
}