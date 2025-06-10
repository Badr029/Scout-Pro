<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Player;
use App\Models\Account;
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
                    'position' => 'ST - Striker',
                    'secondary_position' => ['CF - Center Forward', 'RW - Right Winger'],
                    'gender' => 'Male',
                    'nationality' => 'Egyptian',
                    'current_city' => 'Cairo',
                    'current_club' => 'Al Ahly SC',
                    'previous_clubs' => ['Al Masry SC', 'ENPPI SC'],
                    'playing_style' => 'Pacey striker with excellent finishing ability and good movement in the box',
                    'transfer_status' => 'Available',
                    'bio' => 'Young talented striker looking to make my mark in Egyptian Premier League. Strong in the air and clinical in front of goal.',
                    'membership' => 'premium',
                ]
            ],
            [
                'user' => [
                    'first_name' => 'Diego',
                    'last_name' => 'Silva',
                    'username' => '65',
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
                    'preferred_foot' => 'Left',
                    'position' => 'RW - Right Winger',
                    'secondary_position' => ['LW - Left Winger', 'CAM - Attacking Midfielder'],
                    'gender' => 'Male',
                    'nationality' => 'Egyptian',
                    'current_city' => 'Alexandria',
                    'current_club' => 'Al Ittihad Alexandria',
                    'previous_clubs' => ['El Mokawloon', 'Ghazl El Mahalla'],
                    'playing_style' => 'Technical winger with excellent dribbling skills and pace on the flanks',
                    'transfer_status' => 'Available',
                    'bio' => 'Creative winger with a passion for the beautiful game. Always looking to create chances and beat defenders with pace.',
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
                    'preferred_foot' => 'Right',
                    'position' => 'CM - Central Midfielder',
                    'secondary_position' => ['CDM - Defensive Midfielder', 'CAM - Attacking Midfielder'],
                    'gender' => 'Male',
                    'nationality' => 'Egyptian',
                    'current_city' => 'Giza',
                    'current_club' => 'Zamalek SC',
                    'previous_clubs' => ['Pyramids FC', 'Ceramica Cleopatra FC'],
                    'playing_style' => 'Versatile midfielder with strong work rate and excellent passing range',
                    'transfer_status' => 'Available',
                    'bio' => 'Hard-working midfielder who loves to control the tempo and create opportunities. Never gives up and always fights for the team.',
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
                    'position' => 'CB - Center Back',
                    'secondary_position' => ['RB - Right Back', 'CDM - Defensive Midfielder'],
                    'gender' => 'Male',
                    'nationality' => 'Egyptian',
                    'current_city' => 'Port Said',
                    'current_club' => 'National Bank SC',
                    'previous_clubs' => ['Pharco FC', 'Tala\'ea El Gaish'],
                    'playing_style' => 'Strong aerial defender with good leadership qualities and solid passing from the back',
                    'transfer_status' => 'Available',
                    'bio' => 'Solid defender who takes pride in keeping clean sheets. Strong in the air and a natural leader on the pitch.',
                    'membership' => 'free',
                ]
            ]
        ];

        foreach ($players as $playerData) {
            // First create the account entry
            $account = Account::create([
                'email' => $playerData['user']['email'],
                'password' => $playerData['user']['password'],
                'role' => 'user',
                'is_active' => true,
            ]);

            // Create the user with the main_id
            $playerData['user']['main_id'] = $account->main_id;
            $user = User::create($playerData['user']);

            // Create the player profile
            $playerData['player']['user_id'] = $user->id;
            Player::create($playerData['player']);

            echo "Created player: " . $user->first_name . " " . $user->last_name . " with account ID: " . $account->main_id . "\n";
        }
    }
}
