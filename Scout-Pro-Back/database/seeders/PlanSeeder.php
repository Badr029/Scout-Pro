<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Plan;

class PlanSeeder extends Seeder
{
    public function run()
    {
        Plan::insert([
            ['name' => 'Scout Monthly', 'duration' => 30, 'price' => 1399],
            ['name' => 'Scout Yearly', 'duration' => 365, 'price' => 14279],
            ['name' => 'Player Monthly', 'duration' => 30, 'price' => 149],
            ['name' => 'Player Yearly', 'duration' => 365, 'price' => 1529],
        ]);

    }
}
