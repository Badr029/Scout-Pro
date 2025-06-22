<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Player;
use App\Models\Video;
use Illuminate\Support\Facades\Storage;

class VideoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create storage directories if they don't exist
        Storage::disk('public')->makeDirectory('videos');

        // Get the players created by PlayerSeeder
        $players = User::where('user_type', 'player')
            ->whereIn('username', [
                'marcus_johnson', 'diego_silva', 'alex_thompson', 'jordan_williams',
                'karim_hassan', 'omar_farouk', 'youssef_mahmoud', 'ahmed_zaki'
            ])
            ->get();

        $videos = [
            [
                'username' => 'marcus_johnson',
                'video_file' => 'videos/marcus_johnson_skills.mp4',
                'source_video' => '/Videos/marcus_johnson_skills.mp4',
                'title' => 'Silky Skills and Technical Ability',
                'description' => 'Showcasing my technical skills, ball control, and ability to beat defenders in tight spaces. Working on my first touch and close control.',
            ],
            [
                'username' => 'diego_silva',
                'video_file' => 'videos/diego_silva_passing.mp4',
                'source_video' => '/Videos/diego_silva_passing.mp4',
                'title' => 'Long Range Passing and Vision',
                'description' => 'Demonstrating my passing range and vision with long balls and through passes. Key midfielder skills for controlling the game tempo.',
            ],
            [
                'username' => 'alex_thompson',
                'video_file' => 'videos/alex_thompson_control.mp4',
                'source_video' => '/Videos/alex_thompson_control.mp4',
                'title' => 'Ball Control and First Touch',
                'description' => 'Working on my first touch and ball control under pressure. Essential skills for a midfielder who needs to receive the ball in tight spaces.',
            ],
            [
                'username' => 'jordan_williams',
                'video_file' => 'videos/jordan_williams_defending.mp4',
                'source_video' => '/Videos/jordan_williams_defending.mp4',
                'title' => 'Defensive Skills and Distribution',
                'description' => 'Showcasing my defensive capabilities, tackling, and ball distribution from the back. Clean defending and starting attacks from deep.',
            ],
            [
                'username' => 'karim_hassan',
                'video_file' => 'videos/Video1.mp4',
                'source_video' => '/Videos/Video1.mp4',
                'title' => 'Creative Playmaking Highlights',
                'description' => 'Collection of my best assists, through balls, and creative plays. Demonstrating vision and ability to unlock defenses.',
            ],
            [
                'username' => 'omar_fayed',
                'video_file' => 'videos/Video2.mp4',
                'source_video' => '/Videos/Video2.mp4',
                'title' => 'Defensive Masterclass',
                'description' => 'Highlights of tackles, interceptions, and defensive positioning. Showing ability to read the game and break up attacks.',
            ],
            [
                'username' => 'youssef_mahmoud',
                'video_file' => 'videos/Video3.mp4',
                'source_video' => '/Videos/Video3.mp4',
                'title' => 'Best Saves Compilation',
                'description' => 'Collection of my best saves, showing reflexes, positioning, and shot-stopping ability.',
            ],


        ];

        foreach ($videos as $videoData) {
            // Find the corresponding user and player
            $user = $players->firstWhere('username', $videoData['username']);
            if ($user) {
                $player = $user->player;
                if ($player) {
                    // Copy video from source to storage
                    $sourcePath = storage_path('app/private/public/Seeders/Players' . $videoData['source_video']);
                    $destinationPath = storage_path('app/public/' . $videoData['video_file']);

                    if (file_exists($sourcePath)) {
                        // Ensure the destination directory exists
                        if (!file_exists(dirname($destinationPath))) {
                            mkdir(dirname($destinationPath), 0755, true);
                        }
                        copy($sourcePath, $destinationPath);
                        echo "Copied video for " . $user->first_name . " " . $user->last_name . "\n";
                    } else {
                        echo "Source video not found for " . $user->first_name . " " . $user->last_name . "\n";
                    }

                    Video::create([
                        'user_id' => $user->id,
                        'player_id' => $player->id,
                        'title' => $videoData['title'],
                        'description' => $videoData['description'],
                        'file_path' => $videoData['video_file'],
                        'thumbnail' => null, // Will be generated when video is played
                        'views' => rand(0, 15), // Random views between 50-500
                        'status' => 'active',
                        'created_at' => now()->subDays(rand(1, 30)), // Random creation date within last 30 days
                        'updated_at' => now(),
                    ]);

                    echo "Created video for player: " . $user->first_name . " " . $user->last_name . " (Player ID: " . $player->id . ")\n";
                } else {
                    echo "Player record not found for user: " . $videoData['username'] . "\n";
                }
            } else {
                echo "User not found for username: " . $videoData['username'] . "\n";
            }
        }
    }
}

