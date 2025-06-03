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
    {Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained('payments')->onDelete('cascade');
            $table->dateTime('IssueDate')->default(now());
            $table->string('Status')->default('Paid');
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
