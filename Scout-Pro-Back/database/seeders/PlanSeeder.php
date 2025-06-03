<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Plan;

class PlanSeeder extends Seeder
{
    public function run()
    {
        Plan::insert([
            ['name' => 'Scout Monthly', 'duration' => 30, 'price' => 50],
            ['name' => 'Scout Yearly', 'duration' => 365, 'price' => 100],
            ['name' => 'Player Monthly', 'duration' => 30, 'price' => 50],
            ['name' => 'Player Yearly', 'duration' => 365, 'price' => 100],
        ]);
    }
}