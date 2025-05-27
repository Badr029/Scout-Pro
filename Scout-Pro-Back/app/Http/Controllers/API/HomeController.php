<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Player;
use App\Models\Scout;

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
}

