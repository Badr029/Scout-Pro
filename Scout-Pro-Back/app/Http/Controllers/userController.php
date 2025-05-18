<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

use App\Models\User;
use App\Models\Player;




class userController extends Controller
{
    public function index(){
        return view("welcome");
    }

    public function register(){
        return view('register');
    }

}

