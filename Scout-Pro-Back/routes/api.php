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
use App\Http\Controllers\API\SubscriptionController;
use App\Http\Controllers\API\EventController;
use App\Http\Controllers\API\PlayerController;
use App\Http\Controllers\API\AccountController;
use App\Http\Controllers\API\HomeController;



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


Route::get('/scout-count', [HomeController::class, 'scoutCount']);
Route::get('/player-count', [HomeController::class, 'playerCount']);


Route::middleware('auth:sanctum')->group(function () {
    Route::post('/setup', [SetupController::class, 'setup']);
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('player/profile/update', [ProfileController::class, 'update']);
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

    // New video routes
    Route::get('/videos', [VideoController::class, 'index']);
    Route::post('/videos', [VideoController::class, 'store']);
    Route::get('/videos/{video}', [VideoController::class, 'show']);
    Route::post('/videos/{video}/like', [VideoController::class, 'like']);
    Route::post('/videos/{video}/unlike', [VideoController::class, 'unlike']);
    Route::post('/videos/{video}/comment', [VideoController::class, 'comment']);

    // New subscription routes
    Route::get('/subscription', [SubscriptionController::class, 'show']);
    Route::post('/subscription/upgrade', [SubscriptionController::class, 'upgrade']);
    Route::post('/subscription/cancel', [SubscriptionController::class, 'cancel']);

    // Feed related routes
    Route::get('/events', [EventController::class, 'index']);
    Route::get('/events/{event}', [EventController::class, 'show']);

    // Follow/unfollow routes
    Route::post('/players/{player}/follow', [PlayerController::class, 'follow']);
    Route::post('/players/{player}/unfollow', [PlayerController::class, 'unfollow']);

    // Account management
    Route::post('/account/delete', [AccountController::class, 'delete']);
});
