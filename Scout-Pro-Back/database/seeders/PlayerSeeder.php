<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Player;
use App\Models\Account;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class PlayerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create storage directories if they don't exist
        Storage::disk('public')->makeDirectory('players/profile_images');

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
                    'profile_image' => 'players/profile_images/wzf8JGAX2RwuKzEP2umtnA.jpg',
                    'source_profile_image' => '/Profile_images/wzf8JGAX2RwuKzEP2umtnA.jpg',
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
                    'profile_image' => 'players/profile_images/FxIugCHWIAAbBjv.jpg',
                    'source_profile_image' => '/Profile_images/FxIugCHWIAAbBjv.jpg',
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
                    'profile_image' => 'players/profile_images/GOAL_-_Blank_WEB_-_Facebook_(9).jpg.webp',
                    'source_profile_image' => '/Profile_images/GOAL_-_Blank_WEB_-_Facebook_(9).jpg.webp',
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
                    'profile_image' => 'players/profile_images/2150742376.0.jpg',
                    'source_profile_image' => '/Profile_images/2150742376.0.jpg',
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
            ],
            [
                'user' => [
                    'first_name' => 'Karim',
                    'last_name' => 'Hassan',
                    'username' => 'karim_hassan',
                    'email' => 'karim.hassan@example.com',
                    'password' => Hash::make('password123'),
                    'user_type' => 'player',
                    'email_verified_at' => now(),
                    'setup_completed' => true,
                ],
                'player' => [
                    'profile_image' => 'players/profile_images/images.jpg',
                    'source_profile_image' => '/Profile_images/images.jpg',
                    'username' => 'karim_hassan',
                    'first_name' => 'Karim',
                    'last_name' => 'Hassan',
                    'DateofBirth' => Carbon::parse('2002-05-20'),
                    'phone_number' => '+1234567894',
                    'height' => 178,
                    'weight' => 70,
                    'preferred_foot' => 'Left',
                    'position' => 'CAM - Attacking Midfielder',
                    'secondary_position' => ['LW - Left Winger', 'CM - Central Midfielder'],
                    'gender' => 'Male',
                    'nationality' => 'Egyptian',
                    'current_city' => 'Alexandria',
                    'current_club' => 'Smouha SC',
                    'previous_clubs' => ['Al Ittihad', 'Haras El Hodoud'],
                    'playing_style' => 'Creative playmaker with excellent vision and passing ability',
                    'transfer_status' => 'Available',
                    'bio' => 'Technical midfielder with a eye for the final pass. Specializing in set-pieces and creating chances.',
                    'membership' => 'premium',
                ]
            ],
            [
                'user' => [
                    'first_name' => 'Omar',
                    'last_name' => 'Fayed',
                    'username' => 'omar_fayed',
                    'email' => 'omar.fayed@example.com',
                    'password' => Hash::make('password123'),
                    'user_type' => 'player',
                    'email_verified_at' => now(),
                    'setup_completed' => true,
                ],
                'player' => [
                    'profile_image' => 'players/profile_images/omar-fayed-of-egypt-during-the-2023-africa-cup-of-nations-u20-match-between-egypt-and-senegal.jpg',
                    'source_profile_image' => '/Profile_images/omar-fayed-of-egypt-during-the-2023-africa-cup-of-nations-u20-match-between-egypt-and-senegal .jpg',
                    'username' => 'omar_fayed',
                    'first_name' => 'Omar',
                    'last_name' => 'Fayed',
                    'DateofBirth' => Carbon::parse('2003-08-12'),
                    'phone_number' => '+1234567895',
                    'height' => 182,
                    'weight' => 75,
                    'preferred_foot' => 'Right',
                    'position' => 'CDM - Defensive Midfielder',
                    'secondary_position' => ['CB - Center Back', 'CM - Central Midfielder'],
                    'gender' => 'Male',
                    'nationality' => 'Egyptian',
                    'current_city' => 'Port Said',
                    'current_club' => 'Al Masry',
                    'previous_clubs' => ['Ismaily SC', 'El Daklyeh'],
                    'playing_style' => 'Strong defensive midfielder with excellent positioning and tackling',
                    'transfer_status' => 'Available',
                    'bio' => 'Defensive specialist focusing on breaking up play and starting counter-attacks.',
                    'membership' => 'free',
                ]
            ],
            [
                'user' => [
                    'first_name' => 'Youssef',
                    'last_name' => 'Mahmoud',
                    'username' => 'youssef_mahmoud',
                    'email' => 'youssef.mahmoud@example.com',
                    'password' => Hash::make('password123'),
                    'user_type' => 'player',
                    'email_verified_at' => now(),
                    'setup_completed' => true,
                ],
                'player' => [
                    'profile_image' => 'players/profile_images/Travis-Akomeah-action-shot.jpg',
                    'source_profile_image' => '/Profile_images/Travis-Akomeah-action-shot.jpg',
                    'username' => 'youssef_mahmoud',
                    'first_name' => 'Youssef',
                    'last_name' => 'Mahmoud',
                    'DateofBirth' => Carbon::parse('2001-12-03'),
                    'phone_number' => '+1234567896',
                    'height' => 188,
                    'weight' => 82,
                    'preferred_foot' => 'Right',
                    'position' => 'LW - Left Winger',
                    'secondary_position' => ['RW - Right Winger', 'LM - Left Midfielder'],
                    'gender' => 'Male',
                    'nationality' => 'Egyptian',
                    'current_city' => 'Cairo',
                    'current_club' => 'El Gouna FC',
                    'previous_clubs' => ['Wadi Degla', 'El Dakhleya'],
                    'playing_style' => 'Modern goalkeeper with excellent distribution and shot-stopping ability',
                    'transfer_status' => 'Available',
                    'bio' => 'Commanding goalkeeper with strong aerial ability and good communication skills.',
                    'membership' => 'premium',
                ]
            ],
            [
                'user' => [
                    'first_name' => 'Ahmed',
                    'last_name' => 'Zaki',
                    'username' => 'ahmed_zaki',
                    'email' => 'ahmed.zaki@example.com',
                    'password' => Hash::make('password123'),
                    'user_type' => 'player',
                    'email_verified_at' => now(),
                    'setup_completed' => true,
                ],
                'player' => [
                    'profile_image' => 'players/profile_images/AA1D3E4R.jpg',
                    'source_profile_image' => '/Profile_images/AA1D3E4R.jpg',
                    'username' => 'ahmed_zaki',
                    'first_name' => 'Ahmed',
                    'last_name' => 'Zaki',
                    'DateofBirth' => Carbon::parse('2002-07-15'),
                    'phone_number' => '+1234567897',
                    'height' => 176,
                    'weight' => 68,
                    'preferred_foot' => 'Left',
                    'position' => 'LB - Left Back',
                    'secondary_position' => ['LWB - Left Wing Back', 'LM - Left Midfielder'],
                    'gender' => 'Male',
                    'nationality' => 'Egyptian',
                    'current_city' => 'Giza',
                    'current_club' => 'Ceramica Cleopatra FC',
                    'previous_clubs' => ['Al Mokawloon', 'Tala\'ea El Gaish'],
                    'playing_style' => 'Attack-minded fullback with excellent crossing and dribbling ability',
                    'transfer_status' => 'Available',
                    'bio' => 'Modern fullback who loves to contribute to attacks while maintaining defensive solidity.',
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

            // Copy profile image from source to storage
            $sourcePath = storage_path('app/private/public/Seeders/Players' . $playerData['player']['source_profile_image']);
            $destinationPath = storage_path('app/public/' . $playerData['player']['profile_image']);

            if (file_exists($sourcePath)) {
                // Ensure the destination directory exists
                if (!file_exists(dirname($destinationPath))) {
                    mkdir(dirname($destinationPath), 0755, true);
                }
                copy($sourcePath, $destinationPath);
                echo "Copied profile image for " . $user->first_name . " " . $user->last_name . "\n";
            } else {
                echo "Source profile image not found for " . $user->first_name . " " . $user->last_name . "\n";
            }

            // Remove source_profile_image as it's not a database field
            unset($playerData['player']['source_profile_image']);

            Player::create($playerData['player']);

            echo "Created player: " . $user->first_name . " " . $user->last_name . " with account ID: " . $account->main_id . "\n";
        }
    }
}
