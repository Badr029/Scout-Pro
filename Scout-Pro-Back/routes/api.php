<?php

use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\SetupController;
use App\Http\Controllers\API\ProfileController;
use App\Http\Controllers\API\ResetPasswordController;
use App\Http\Controllers\API\FeedController;
use App\Http\Controllers\API\VideoController;



    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('auth/google/callback', [AuthController::class, 'handleGoogleCallback']);
    // Route::post('/login/facebook/callback', [AuthController::class, 'handleFacebookCallback']);

    // Email verification route (manually defined)
    Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {
        $user = \App\Models\User::findOrFail($id);

    if ($user->hasVerifiedEmail()) {
        return response()->json(['message' => 'Email already verified.'], 200);
    }

    if ($user->markEmailAsVerified()) {
        event(new Verified($user));
    }

    return response()->json(['message' => 'Email verified successfully.'], 200);
})->name('verification.verify');


// Request password reset link

Route::post('/forgot-password', [ResetPasswordController::class, 'sendResetLink']);
Route::post('/reset-password', [ResetPasswordController::class, 'reset']);



Route::middleware('auth:sanctum')->group(function () {
    Route::post('/setup', [SetupController::class, 'setup']);
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/update', [ProfileController::class, 'update']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::delete('/delete',[ProfileController::class , 'delete']);

    // Feed routes
    Route::get('/feed', [FeedController::class, 'index']);
    Route::get('/feed/search', [FeedController::class, 'search']);
    Route::get('/feed/videos', [FeedController::class, 'filterVideos']);
    Route::post('/feed/like', [FeedController::class, 'toggleLike']);
    Route::post('/feed/follow', [FeedController::class, 'toggleFollow']);
    Route::get('/feed/events', [FeedController::class, 'getEvents']);

    // Video routes
    Route::post('/videos/upload', [VideoController::class, 'upload']);
    Route::delete('/videos/{id}', [VideoController::class, 'delete']);
    Route::get('/videos/player/{playerId}', [VideoController::class, 'getPlayerVideos']);

    // Setup routes
    Route::post('/player/setup', [SetupController::class, 'playerSetup']);
    Route::post('/scout/setup', [SetupController::class, 'scoutSetup']);
});
