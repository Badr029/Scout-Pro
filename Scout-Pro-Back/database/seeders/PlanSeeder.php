<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Plan;

class PlanSeeder extends Seeder
{
    public function run()
    {
        Plan::insert([
            ['Name' => 'Scout Monthly', 'Duration' => 30, 'Price' => 1400],
            ['Name' => 'Scout Yearly', 'Duration' => 365, 'Price' => 15000],
            ['Name' => 'Player Monthly', 'Duration' => 30, 'Price' => 375],
            ['Name' => 'Player Yearly', 'Duration' => 365, 'Price' => 4200],
        ]);

    }
}
