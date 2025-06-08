<?php

use Illuminate\Support\Facades\Route;

// Basic fallback route
Route::get('/', function () {
    return response()->json(['message' => 'Scout Pro API']);
});




