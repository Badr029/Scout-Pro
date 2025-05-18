<?php



use Illuminate\Support\Facades\Route;
use App\Http\Controllers\userController;
use App\Http\Controllers\userprofileController;


use Illuminate\Http\Request;


// Web routes for views only
Route::get('/',[userController::class,'index']);




