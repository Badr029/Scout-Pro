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
    {Schema::create('payments', function (Blueprint $table) {
    $table->id();
    $table->float('amount');
    $table->string('card_number_encrypted');
        $table->string('card_last_four');
        $table->string('expiry');
        $table->string('cvv_encrypted');
        $table->string('cardholder_name')->nullable();
    $table->timestamps();
    
    });}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};