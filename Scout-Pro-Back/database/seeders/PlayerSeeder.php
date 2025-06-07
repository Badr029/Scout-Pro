<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Player;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class PlayerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $players = [
            [
                'user' => [
                    'first_name' => 'Marcus',
                    'last_name' => 'Johnson',
                    'username' => 'marcus_johnson',
                    'email' => 'marcus.johnson@example.com',
                    'password' => Hash::make('password123'),
                    'user_type' => 'player',
                    'email_verified_at' => now(),
                    'setup_completed' => true,
                ],
                'player' => [
                    'profile_image' => 'players/wzf8JGAX2RwuKzEP2umtnA.jpg',
                    'username' => 'marcus_johnson',
                    'first_name' => 'Marcus',
                    'last_name' => 'Johnson',
                    'DateofBirth' => Carbon::parse('2001-03-15'),
                    'phone_number' => '+1234567890',
                    'height' => 185,
                    'weight' => 78,
                    'preferred_foot' => 'Right',
                    'position' => 'Forward',
                    'secondary_position' => ['Winger', 'Attacking Midfielder'],
                    'gender' => 'Male',
                    'nationality' => 'British',
                    'current_city' => 'Manchester',
                    'current_club' => 'Manchester United',
                    'previous_clubs' => ['Chelsea Youth', 'Brighton Academy'],
                    'playing_style' => 'Pacey, direct runner with good finishing ability',
                    'transfer_status' => 'Available',
                    'bio' => 'Young talented forward looking to make my mark in professional football. Strong in the air and clinical in front of goal.',
                    'membership' => 'premium',
                ]
            ],
            [
                'user' => [
                    'first_name' => 'Diego',
                    'last_name' => 'Silva',
                    'username' => 'diego_silva',
                    'email' => 'diego.silva@example.com',
                    'password' => Hash::make('password123'),
                    'user_type' => 'player',
                    'email_verified_at' => now(),
                    'setup_completed' => true,
                ],
                'player' => [
                    'profile_image' => 'players/FxIugCHWIAAbBjv.jpg',
                    'username' => 'diego_silva',
                    'first_name' => 'Diego',
                    'last_name' => 'Silva',
                    'DateofBirth' => Carbon::parse('2000-07-22'),
                    'phone_number' => '+1234567891',
                    'height' => 175,
                    'weight' => 72,
                    'preferred_foot' => 'Right',
                    'position' => 'Midfielder',
                    'secondary_position' => ['Central Midfielder', 'Attacking Midfielder'],
                    'gender' => 'Male',
                    'nationality' => 'Portuguese',
                    'current_city' => 'Porto',
                    'current_club' => 'FC Porto',
                    'previous_clubs' => ['Benfica Youth', 'Sporting CP Academy'],
                    'playing_style' => 'Technical player with excellent ball control and passing range',
                    'transfer_status' => 'Available',
                    'bio' => 'Creative midfielder with a passion for the beautiful game. Always looking to create chances and control the tempo.',
                    'membership' => 'free',
                ]
            ],
            [
                'user' => [
                    'first_name' => 'Alex',
                    'last_name' => 'Thompson',
                    'username' => 'alex_thompson',
                    'email' => 'alex.thompson@example.com',
                    'password' => Hash::make('password123'),
                    'user_type' => 'player',
                    'email_verified_at' => now(),
                    'setup_completed' => true,
                ],
                'player' => [
                    'profile_image' => 'players/GOAL_-_Blank_WEB_-_Facebook_(9).jpg.webp',
                    'username' => 'alex_thompson',
                    'first_name' => 'Alex',
                    'last_name' => 'Thompson',
                    'DateofBirth' => Carbon::parse('2002-11-08'),
                    'phone_number' => '+1234567892',
                    'height' => 180,
                    'weight' => 75,
                    'preferred_foot' => 'Left',
                    'position' => 'Midfielder',
                    'secondary_position' => ['Defensive Midfielder', 'Central Midfielder'],
                    'gender' => 'Male',
                    'nationality' => 'English',
                    'current_city' => 'London',
                    'current_club' => 'Chelsea FC',
                    'previous_clubs' => ['Arsenal Academy', 'West Ham Youth'],
                    'playing_style' => 'Versatile midfielder with strong defensive work rate and good distribution',
                    'transfer_status' => 'Available',
                    'bio' => 'Hard-working midfielder who loves to break up play and start attacks. Never gives up and always fights for the team.',
                    'membership' => 'premium',
                ]
            ],
            [
                'user' => [
                    'first_name' => 'Jordan',
                    'last_name' => 'Williams',
                    'username' => 'jordan_williams',
                    'email' => 'jordan.williams@example.com',
                    'password' => Hash::make('password123'),
                    'user_type' => 'player',
                    'email_verified_at' => now(),
                    'setup_completed' => true,
                ],
                'player' => [
                    'profile_image' => 'players/2150742376.0.jpg',
                    'username' => 'jordan_williams',
                    'first_name' => 'Jordan',
                    'last_name' => 'Williams',
                    'DateofBirth' => Carbon::parse('2001-09-12'),
                    'phone_number' => '+1234567893',
                    'height' => 190,
                    'weight' => 82,
                    'preferred_foot' => 'Right',
                    'position' => 'Defender',
                    'secondary_position' => ['Centre-back', 'Right-back'],
                    'gender' => 'Male',
                    'nationality' => 'American',
                    'current_city' => 'Los Angeles',
                    'current_club' => 'LA Galaxy',
                    'previous_clubs' => ['Inter Miami CF', 'Atlanta United'],
                    'playing_style' => 'Strong aerial defender with good pace and leadership qualities',
                    'transfer_status' => 'Available',
                    'bio' => 'Solid defender who takes pride in keeping clean sheets. Strong in the air and a natural leader on the pitch.',
                    'membership' => 'free',
                ]
            ]
        ];

        foreach ($players as $playerData) {
            // Create the user
            $user = User::create($playerData['user']);

            // Create the player profile
            $playerData['player']['user_id'] = $user->id;
            Player::create($playerData['player']);

            echo "Created player: " . $user->first_name . " " . $user->last_name . "\n";
        }
    }
}
