<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Scout;
use App\Models\Account;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class ScoutSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $scouts = [
            [
                'user' => [
                    'first_name' => 'Abdulrahman',
                    'last_name' => 'Ahmed',
                    'username' => 'abdulrahman_ahmed',
                    'email' => 'abdulrahman.ahmed@example.com',
                    'password' => Hash::make('password123'),
                    'user_type' => 'scout',
                    'email_verified_at' => now(),
                    'setup_completed' => true,
                ],
                'scout' => [
                    'profile_image' => 'scouts/Scouts/Profile images/Abdulrahman Ahmed .png',
                    'username' => 'abdulrahman_ahmed',
                    'first_name' => 'Abdulrahman',
                    'last_name' => 'Ahmed',
                    'city' => 'Cairo',
                    'country' => 'Egypt',
                    'contact_email' => 'abdulrahman.ahmed@example.com',
                    'contact_phone' => '+201234567001',
                    'organization' => 'Al Ahly SC',
                    'position_title' => 'Chief Scout',
                    'scouting_regions' => ['Egypt - Premier League', 'Egypt - Second Division'],
                    'age_groups' => ['U18', 'U21', 'Senior'],
                    'preferred_roles' => ['GK - Goalkeeper', 'CB - Center Back', 'CDM - Defensive Midfielder'],
                    'clubs_worked_with' => 'Al Ahly SC, Zamalek SC, Egyptian National Team',
                    'linkedin_url' => 'https://www.linkedin.com/in/abdulrahman-ahmed',
                    'id_proof_path' => 'scouts/Scouts/IDs/Abdulrahman Ahmed .png',
                    'certifications' => ['scouts/Scouts/Certificates/ChatGPT Image Jun 8, 2025, 06_09_08 PM.png'],
                    'registration_completed' => true,
                    'subscription_active' => true,
                    'subscription_expires_at' => Carbon::now()->addYear(),
                ]
            ],
            [
                'user' => [
                    'first_name' => 'Khaled',
                    'last_name' => 'Mostafa',
                    'username' => 'khaled_mostafa',
                    'email' => 'khaled.mostafa@example.com',
                    'password' => Hash::make('password123'),
                    'user_type' => 'scout',
                    'email_verified_at' => now(),
                    'setup_completed' => true,
                ],
                'scout' => [
                    'profile_image' => 'scouts/Scouts/Profile images/Khaled Mostafa .png',
                    'username' => 'khaled_mostafa',
                    'first_name' => 'Khaled',
                    'last_name' => 'Mostafa',
                    'city' => 'Alexandria',
                    'country' => 'Egypt',
                    'contact_email' => 'khaled.mostafa@example.com',
                    'contact_phone' => '+201234567002',
                    'organization' => 'Zamalek SC',
                    'position_title' => 'Youth Scout',
                    'scouting_regions' => ['Egypt - Youth Leagues', 'Egypt - Third Division'],
                    'age_groups' => ['U12', 'U14', 'U16', 'U18'],
                    'preferred_roles' => ['ST - Striker', 'CF - Center Forward', 'RW - Right Winger', 'LW - Left Winger'],
                    'clubs_worked_with' => 'Zamalek SC, Al Ittihad Alexandria, Al Masry SC',
                    'linkedin_url' => 'https://www.linkedin.com/in/khaled-mostafa',
                    'id_proof_path' => 'scouts/Scouts/IDs/Khaled Mostafa.png',
                    'certifications' => ['scouts/Scouts/Certificates/ChatGPT Image Jun 8, 2025, 06_03_27 PM.png'],
                    'registration_completed' => true,
                    'subscription_active' => true,
                    'subscription_expires_at' => Carbon::now()->addMonths(6),
                ]
            ],
            [
                'user' => [
                    'first_name' => 'Youssef',
                    'last_name' => 'Ismail',
                    'username' => 'youssef_ismail',
                    'email' => 'youssef.ismail@example.com',
                    'password' => Hash::make('password123'),
                    'user_type' => 'scout',
                    'email_verified_at' => now(),
                    'setup_completed' => true,
                ],
                'scout' => [
                    'profile_image' => 'scouts/Scouts/Profile images/Youssef Ismail.png',
                    'username' => 'youssef_ismail',
                    'first_name' => 'Youssef',
                    'last_name' => 'Ismail',
                    'city' => 'Giza',
                    'country' => 'Egypt',
                    'contact_email' => 'youssef.ismail@example.com',
                    'contact_phone' => '+201234567003',
                    'organization' => 'Egyptian Football Association',
                    'position_title' => 'Technical Scout',
                    'scouting_regions' => ['Egypt - Premier League', 'Egypt - Youth Leagues'],
                    'age_groups' => ['U17', 'U19', 'U21', 'U23'],
                    'preferred_roles' => ['CAM - Attacking Midfielder', 'CM - Central Midfielder', 'RM - Right Midfielder', 'LM - Left Midfielder'],
                    'clubs_worked_with' => 'Al Ahly SC, Egyptian National Team, Pyramids FC',
                    'linkedin_url' => 'https://www.linkedin.com/in/youssef-ismail',
                    'id_proof_path' => 'scouts/Scouts/IDs/Youssef Ismail.png',
                    'certifications' => ['scouts/Scouts/Certificates/ChatGPT Image Jun 8, 2025, 06_00_26 PM.png'],
                    'registration_completed' => true,
                    'subscription_active' => true,
                    'subscription_expires_at' => Carbon::now()->addYear(),
                ]
            ],
            [
                'user' => [
                    'first_name' => 'Khaled',
                    'last_name' => 'Hassan',
                    'username' => 'khaled_hassan',
                    'email' => 'khaled.hassan@example.com',
                    'password' => Hash::make('password123'),
                    'user_type' => 'scout',
                    'email_verified_at' => now(),
                    'setup_completed' => true,
                ],
                'scout' => [
                    'profile_image' => 'scouts/Scouts/Profile images/khaled Hassan.png',
                    'username' => 'khaled_hassan',
                    'first_name' => 'Khaled',
                    'last_name' => 'Hassan',
                    'city' => 'Ismailia',
                    'country' => 'Egypt',
                    'contact_email' => 'khaled.hassan@example.com',
                    'contact_phone' => '+201234567004',
                    'organization' => 'Ismaily SC',
                    'position_title' => 'Goalkeeper Coach & Scout',
                    'scouting_regions' => ['Egypt - Premier League', 'Egypt - Second Division'],
                    'age_groups' => ['U16', 'U18', 'U21', 'Senior'],
                    'preferred_roles' => ['GK - Goalkeeper'],
                    'clubs_worked_with' => 'Ismaily SC, Al Ahly SC, Egyptian National Team, ENPPI SC',
                    'linkedin_url' => 'https://www.linkedin.com/in/khaled-hassan',
                    'id_proof_path' => 'scouts/Scouts/IDs/khaled Hassan.png',
                    'certifications' => ['scouts/Scouts/Certificates/ChatGPT Image Jun 8, 2025, 05_57_56 PM.png'],
                    'registration_completed' => true,
                    'subscription_active' => true,
                    'subscription_expires_at' => Carbon::now()->addMonths(9),
                ]
            ],
            [
                'user' => [
                    'first_name' => 'Mostafa',
                    'last_name' => 'Hassan',
                    'username' => 'mostafa_hassan',
                    'email' => 'mostafa.hassan@example.com',
                    'password' => Hash::make('password123'),
                    'user_type' => 'scout',
                    'email_verified_at' => now(),
                    'setup_completed' => true,
                ],
                'scout' => [
                    'profile_image' => 'scouts/Scouts/Profile images/Mostafa Hassan .png',
                    'username' => 'mostafa_hassan',
                    'first_name' => 'Mostafa',
                    'last_name' => 'Hassan',
                    'city' => 'Port Said',
                    'country' => 'Egypt',
                    'contact_email' => 'mostafa.hassan@example.com',
                    'contact_phone' => '+201234567005',
                    'organization' => 'Future FC',
                    'position_title' => 'Defensive Scout',
                    'scouting_regions' => ['Egypt - Premier League', 'Egypt - Third Division'],
                    'age_groups' => ['U18', 'U21', 'U23', 'Senior'],
                    'preferred_roles' => ['CB - Center Back', 'RB - Right Back', 'LB - Left Back', 'CDM - Defensive Midfielder'],
                    'clubs_worked_with' => 'Al Ahly SC, Future FC, National Bank SC, Ceramica Cleopatra FC',
                    'linkedin_url' => 'https://www.linkedin.com/in/mostafa-hassan',
                    'id_proof_path' => 'scouts/Scouts/IDs/Mostafa Hassan .png',
                    'certifications' => ['scouts/Scouts/Certificates/ChatGPT Image Jun 8, 2025, 06_10_40 PM.png'],
                    'registration_completed' => true,
                    'subscription_active' => true,
                    'subscription_expires_at' => Carbon::now()->subMonths(2),
                ]
            ]
        ];

        foreach ($scouts as $scoutData) {
            // First create the account entry
            $account = Account::create([
                'email' => $scoutData['user']['email'],
                'password' => $scoutData['user']['password'],
                'role' => 'user',
                'is_active' => true,
            ]);

            // Create the user with the main_id
            $scoutData['user']['main_id'] = $account->main_id;
            $user = User::create($scoutData['user']);

            // Create the scout profile
            $scoutData['scout']['user_id'] = $user->id;
            Scout::create($scoutData['scout']);

            echo "Created scout: " . $user->first_name . " " . $user->last_name . " with account ID: " . $account->main_id . "\n";
        }
    }
}

