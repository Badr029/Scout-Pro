<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Video;

class VideoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the players created by PlayerSeeder
        $players = User::where('user_type', 'player')
            ->whereIn('username', ['marcus_johnson', 'diego_silva', 'alex_thompson', 'jordan_williams'])
            ->get();

        // First, let's rename the video files to remove special characters
        $videoFiles = [
            'SILKY behaviour 😮_💨 🔥 #shorts #chelsea  #football #footballshorts  #conorgallagher.mp4',
            'Route One for Gundogan ☄️ 🇩🇪 #mancity #football #goals #shorts #shortsvideo #shortsfeed.mp4',
            'INCREDIBLE ball control from PHIL FODEN! 🥵🌟 #mancity #football #shorts #shortsvideo #goals #skills.mp4',
            'It was 🥶🥶 at the Bridge! #shorts #football #footballshorts #chelseafc #nutmeg.mp4'
        ];

        $cleanVideoFiles = [
            'marcus_johnson_skills.mp4',
            'diego_silva_passing.mp4',
            'alex_thompson_control.mp4',
            'jordan_williams_defending.mp4'
        ];

        // Rename the video files to clean names
        $storagePath = storage_path('app/public/videos/');
        for ($i = 0; $i < count($videoFiles); $i++) {
            $originalPath = $storagePath . $videoFiles[$i];
            $newPath = $storagePath . $cleanVideoFiles[$i];
            if (file_exists($originalPath) && !file_exists($newPath)) {
                rename($originalPath, $newPath);
                echo "Renamed: " . $videoFiles[$i] . " to " . $cleanVideoFiles[$i] . "\n";
            }
        }

        $videos = [
            [
                'username' => 'marcus_johnson',
                'video_file' => 'marcus_johnson_skills.mp4',
                'title' => 'Silky Skills and Technical Ability',
                'description' => 'Showcasing my technical skills, ball control, and ability to beat defenders in tight spaces. Working on my first touch and close control.',
            ],
            [
                'username' => 'diego_silva',
                'video_file' => 'diego_silva_passing.mp4',
                'title' => 'Long Range Passing and Vision',
                'description' => 'Demonstrating my passing range and vision with long balls and through passes. Key midfielder skills for controlling the game tempo.',
            ],
            [
                'username' => 'alex_thompson',
                'video_file' => 'alex_thompson_control.mp4',
                'title' => 'Ball Control and First Touch',
                'description' => 'Working on my first touch and ball control under pressure. Essential skills for a midfielder who needs to receive the ball in tight spaces.',
            ],
            [
                'username' => 'jordan_williams',
                'video_file' => 'jordan_williams_defending.mp4',
                'title' => 'Defensive Skills and Distribution',
                'description' => 'Showcasing my defensive capabilities, tackling, and ball distribution from the back. Clean defending and starting attacks from deep.',
            ]
        ];

        foreach ($videos as $videoData) {
            // Find the corresponding player
            $player = $players->firstWhere('username', $videoData['username']);
  if ($player) {
                Video::create([
                    'user_id' => $player->id,
                    'title' => $videoData['title'],
                    'description' => $videoData['description'],
                    'file_path' => 'videos/' . $videoData['video_file'],
                    'thumbnail' => null, // Will be generated when video is played
                    'views' => rand(50, 500), // Random views between 50-500
                    'status' => 'active',
                    'created_at' => now()->subDays(rand(1, 30)), // Random creation date within last 30 days
                    'updated_at' => now(),
                ]);

                echo "Created video for player: " . $player->first_name . " " . $player->last_name . "\n";
            } else {
                echo "Player not found for username: " . $videoData['username'] . "\n";
            }
        }
    }
}

