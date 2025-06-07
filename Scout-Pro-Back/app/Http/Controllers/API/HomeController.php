<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Player;
use App\Models\Scout;
use App\Models\Video;
use App\Models\ContactRequest;

class HomeController extends Controller
{

    public function playerCount()
    {
        $Pcount = Player::count();

        return response()->json([
            'player_no' => $Pcount,
        ]);
    }

    public function scoutCount()
    {
        $Scount = Scout::count();

        return response()->json([
            'scout_no' => $Scount,
        ]);
    }

    public function videoCount()
    {
        $videoCount = Video::where('status', 'active')->count();

        return response()->json([
            'video_no' => $videoCount,
        ]);
    }

    public function contactRequestCount()
    {
        $contactCount = ContactRequest::where('status', 'approved')->count();

        return response()->json([
            'contact_no' => $contactCount,
        ]);
    }

    public function getAllStats()
    {
        $stats = [
            'scout_no' => Scout::count(),
            'player_no' => Player::count(),
            'video_no' => Video::where('status', 'active')->count(),
            'contact_no' => ContactRequest::where('status', 'approved')->count(),
        ];

        return response()->json($stats);
    }
}

