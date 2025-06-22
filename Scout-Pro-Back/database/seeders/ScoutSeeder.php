<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Scout;
use App\Models\Account;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class ScoutSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create storage directories if they don't exist
        Storage::disk('public')->makeDirectory('scouts/profile_image');
        Storage::disk('public')->makeDirectory('scouts/id_proofs');
        Storage::disk('public')->makeDirectory('scouts/certifications');

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
                    'profile_image' => 'scouts/profile_image/Abdulrahman Ahmed .png',
                    'source_profile_image' => '/Profile images/Abdulrahman Ahmed .png',
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
                    'id_proof_path' => 'scouts/id_proofs/Abdulrahman Ahmed .png',
                    'source_id_proof' => '/IDs/Abdulrahman Ahmed .png',
                    'certifications' => ['scouts/certifications/Abdulrahman ahmed.png'],
                    'source_certifications' => ['/Certificates/Abdulrahman ahmed.png'],
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
                    'profile_image' => 'scouts/profile_image/Khaled Mostafa .png',
                    'source_profile_image' => '/Profile images/Khaled Mostafa .png',
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
                    'id_proof_path' => 'scouts/id_proofs/Khaled Mostafa.png',
                    'source_id_proof' => '/IDs/Khaled Mostafa.png',
                    'certifications' => ['scouts/certifications/Khalid Mostafa.png'],
                    'source_certifications' => ['/Certificates/Khalid Mostafa.png'],
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
                    'profile_image' => 'scouts/profile_image/Youssef Ismail.png',
                    'source_profile_image' => '/Profile images/Youssef Ismail.png',
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
                    'id_proof_path' => 'scouts/id_proofs/Youssef Ismail.png',
                    'source_id_proof' => '/IDs/Youssef Ismail.png',
                    'certifications' => ['scouts/certifications/Youssif Ismail.png'],
                    'source_certifications' => ['/Certificates/Youssif Ismail.png'],
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
                    'profile_image' => 'scouts/profile_image/khaled Hassan.png',
                    'source_profile_image' => '/Profile images/khaled Hassan.png',
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
                    'id_proof_path' => 'scouts/id_proofs/khaled Hassan.png',
                    'source_id_proof' => '/IDs/khaled Hassan.png',
                    'certifications' => ['scouts/certifications/Khalid Hassan.png'],
                    'source_certifications' => ['/Certificates/Khalid Hassan.png'],
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
                    'profile_image' => 'scouts/profile_image/Mostafa Hassan .png',
                    'source_profile_image' => '/Profile images/Mostafa Hassan .png',
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
                    'id_proof_path' => 'scouts/id_proofs/Mostafa Hassan .png',
                    'source_id_proof' => '/IDs/Mostafa Hassan .png',
                    'certifications' => ['scouts/certifications/Mostafa Hassan.png'],
                    'source_certifications' => ['/Certificates/Mostafa Hassan.png'],
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

            // Copy profile image from source to storage
            $sourcePath = storage_path('app/private/public/Seeders/Scouts' . $scoutData['scout']['source_profile_image']);
            $destinationPath = storage_path('app/public/' . $scoutData['scout']['profile_image']);
            
            if (file_exists($sourcePath)) {
                // Ensure the destination directory exists
                if (!file_exists(dirname($destinationPath))) {
                    mkdir(dirname($destinationPath), 0755, true);
                }
                copy($sourcePath, $destinationPath);
                echo "Copied profile image for " . $user->first_name . " " . $user->last_name . "\n";
            } else {
                echo "Source profile image not found for " . $user->first_name . " " . $user->last_name . ": " . $sourcePath . "\n";
            }

            // Copy ID proof from source to storage
            $sourcePath = storage_path('app/private/public/Seeders/Scouts' . $scoutData['scout']['source_id_proof']);
            $destinationPath = storage_path('app/public/' . $scoutData['scout']['id_proof_path']);
            
            if (file_exists($sourcePath)) {
                // Ensure the destination directory exists
                if (!file_exists(dirname($destinationPath))) {
                    mkdir(dirname($destinationPath), 0755, true);
                }
                copy($sourcePath, $destinationPath);
                echo "Copied ID proof for " . $user->first_name . " " . $user->last_name . "\n";
            } else {
                echo "Source ID proof not found for " . $user->first_name . " " . $user->last_name . ": " . $sourcePath . "\n";
            }

            // Copy certificates from source to storage
            $certifications = [];
            foreach ($scoutData['scout']['source_certifications'] as $index => $sourceCert) {
                $sourcePath = storage_path('app/private/public/Seeders/Scouts' . $sourceCert);
                $destinationPath = storage_path('app/public/' . $scoutData['scout']['certifications'][$index]);
                
                if (file_exists($sourcePath)) {
                    // Ensure the destination directory exists
                    if (!file_exists(dirname($destinationPath))) {
                        mkdir(dirname($destinationPath), 0755, true);
                    }
                    copy($sourcePath, $destinationPath);
                    $certifications[] = $scoutData['scout']['certifications'][$index];
                    echo "Copied certificate for " . $user->first_name . " " . $user->last_name . "\n";
                } else {
                    echo "Source certificate not found for " . $user->first_name . " " . $user->last_name . ": " . $sourcePath . "\n";
                }
            }

            // Update certifications array to only include successfully copied files
            $scoutData['scout']['certifications'] = $certifications;

            // Remove source fields as they're not database fields
            unset($scoutData['scout']['source_profile_image']);
            unset($scoutData['scout']['source_id_proof']);
            unset($scoutData['scout']['source_certifications']);
            
            Scout::create($scoutData['scout']);

            echo "Created scout: " . $user->first_name . " " . $user->last_name . " with account ID: " . $account->main_id . "\n";
        }
    }
}

