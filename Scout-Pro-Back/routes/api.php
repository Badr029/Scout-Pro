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
use App\Http\Controllers\API\ScoutController;
use App\Http\Controllers\API\AdminController;
use App\Http\Controllers\API\ContactRequestController;



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
    Route::get('scout/profile', [ProfileController::class, 'show']);
    Route::get('scout/contacted-players', [ScoutController::class, 'getContactedPlayers']);
    Route::put('player/profile/update', [ProfileController::class, 'update']);
    Route::put('scout/profile/update', [ProfileController::class, 'update']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::delete('/delete',[ProfileController::class , 'delete']);

    // Feed routes
    Route::get('/feed', [FeedController::class, 'index']);
    Route::get('/feed/search', [FeedController::class, 'search']);
    Route::get('/feed/videos', [FeedController::class, 'filterVideos']);
    Route::post('/feed/like', [FeedController::class, 'toggleLike']);
    Route::get('/feed/events', [FeedController::class, 'getEvents']);
    Route::get('/premium-players', [FeedController::class, 'getPremiumPlayers']);

    // Follow routes
    Route::post('/users/{userId}/follow', [PlayerController::class, 'follow']);
    Route::post('/users/{userId}/unfollow', [PlayerController::class, 'unfollow']);
    Route::get('/users/{userId}/follow-status', [PlayerController::class, 'getFollowStatus']);

    // Video routes
    Route::post('/videos/upload', [VideoController::class, 'upload']);
    Route::delete('/videos/{id}', [VideoController::class, 'delete']);
    Route::get('/videos/player/{playerId}', [VideoController::class, 'getPlayerVideos']);
    Route::post('/videos/chunk', [VideoController::class, 'uploadChunk']);
    Route::post('/videos/finalize', [VideoController::class, 'finalizeUpload']);
    Route::post('/videos/{video}/like', [VideoController::class, 'like']);
    Route::post('/videos/{video}/unlike', [VideoController::class, 'unlike']);
    Route::post('/videos/{video}/comment', [VideoController::class, 'comment']);
    Route::get('/videos/{video}/comments', [VideoController::class, 'getComments']);
    Route::get('/videos/{video}/like-status', [VideoController::class, 'getLikeStatus']);
    Route::post('/videos/{video}/view', [VideoController::class, 'recordView']);
    Route::get('/videos/{video}/likes', [VideoController::class, 'getLikes']);

    // Setup routes
    Route::post('/player/setup', [SetupController::class, 'playerSetup']);
    Route::post('/scout/setup', [SetupController::class, 'scoutSetup']);

    // New video routes
    Route::get('/videos', [VideoController::class, 'index']);
    Route::post('/videos', [VideoController::class, 'store']);
    Route::get('/videos/{video}', [VideoController::class, 'show']);

    // New subscription routes
    Route::get('/subscription', [SubscriptionController::class, 'show']);
    Route::get('/plans', [SubscriptionController::class, 'getPlans']);
    Route::post('/subscription/upgrade', [SubscriptionController::class, 'upgrade']);
    Route::post('/subscription/cancel', [SubscriptionController::class, 'cancel']);
    Route::get('/player/{id}/subscription-status', [SubscriptionController::class, 'checkSubscriptionStatus']);

    // Scout subscription routes
    Route::post('/subscription/scout/upgrade', [SubscriptionController::class, 'upgradeScout']);
    Route::post('/subscription/scout/cancel', [SubscriptionController::class, 'cancelScout']);
    Route::get('/scout/{id}/subscription-status', [SubscriptionController::class, 'checkScoutSubscriptionStatus']);
    Route::get('/subscription/scout/status', [SubscriptionController::class, 'getScoutSubscriptionStatus']);

    // Feed related routes
    Route::get('/events', [EventController::class, 'index']);
    Route::post('/events', [EventController::class, 'store']);
    Route::get('/events/{event}', [EventController::class, 'show']);
    Route::put('/events/{event}/status', [EventController::class, 'updateStatus'])->middleware('admin');
    Route::get('/player/{user_id}', [FeedController::class, 'playerviewprofile']);
    Route::get('/scout/{user_id}', [FeedController::class, 'scoutviewprofile']);
    Route::get('/trending-players', [PlayerController::class, 'getTrendingPlayers']);

    // Account management
    Route::post('/account/delete', [AccountController::class, 'delete']);

    // Feed and Search Routes
    Route::post('/search', [FeedController::class, 'search']);

    // Admin routes
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('/admin/stats', [AdminController::class, 'stats']);
        Route::get('/admin/user-growth', [AdminController::class, 'userGrowth']);
        Route::get('/admin/engagement', [AdminController::class, 'engagement']);
        Route::get('/admin/video-stats', [AdminController::class, 'videoStats']);
        Route::get('/admin/contact-requests', [AdminController::class, 'getContactRequests']);
        Route::put('/admin/contact-requests/{id}', [AdminController::class, 'updateContactRequest']);
        Route::get('/admin/event-requests', [AdminController::class, 'getEventRequests']);
        Route::put('/admin/event-requests/{id}', [AdminController::class, 'updateEventRequest']);
    });

    // Contact Request Routes
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::post('/contact-requests', [ContactRequestController::class, 'store']);
        Route::get('/contact-requests/check/{playerId}', [ContactRequestController::class, 'checkStatus']);
    });
});
