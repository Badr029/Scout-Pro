<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Plan;

class PlanSeeder extends Seeder
{
    public function run()
    {
        Plan::insert([
            ['Name' => 'Scout Monthly', 'Duration' => 30, 'Price' => 1399],
            ['Name' => 'Scout Yearly', 'Duration' => 365, 'Price' => 14279],
            ['Name' => 'Player Monthly', 'Duration' => 30, 'Price' => 149],
            ['Name' => 'Player Yearly', 'Duration' => 365, 'Price' => 1529],
        ]);

    }
}
