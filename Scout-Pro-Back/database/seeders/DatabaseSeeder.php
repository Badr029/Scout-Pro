<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(PlanSeeder::class);
        $this->call(AdminSeederNew::class);  // Creates admins and their accounts
        $this->call(PlayerSeeder::class);    // Creates users and their accounts
        $this->call(ScoutSeeder::class);     // Creates users and their accounts
        $this->call(SubscriptionPaymentSeeder::class);
        $this->call(VideoSeeder::class);
    }
}
