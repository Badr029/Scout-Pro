<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Auth\Events\Verified;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;
use App\Models\Account;

class AuthController extends Controller
{
    // Register new user and send email verification
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_type' => 'required|string|in:player,scout',//register as
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => [
                'required',
                'string',
                'min:8',
                'max:64',
                'confirmed',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/'
            ],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        // First create the account entry
        $account = Account::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'user',
            'is_active' => true,
        ]);

        // Then create the user with the main_id from the account
        $user = User::create([
            "user_type" => $request->user_type,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'main_id' => $account->main_id,
        ]);

        // Send email verification notification
        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Registration successful! Please check your email for verification.',
            'user' => $user,
        ], 201);
    }

    // Login and issue token if email is verified
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email|max:255',
            'password' => 'required|string|min:8',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Incorrect Email or Password'], 401);
        }

        $user = User::with(['player', 'scout'])->where('email', $request['email'])->firstOrFail();

        if ($user && $user->social_id && !$user->password) {
            return response()->json([
                'message' => 'You signed up using Google. Please use "Login with Google".'
            ], 403);
        }

        // Check if the user has verified their email
        if (!$user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Please verify your email before logging in.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        // Check if user has completed setup
        $setupCompleted = $user->hasCompletedSetup();

        // Get user profile data including membership status
        $userData = [
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'user_type' => $user->user_type,
            'profile_image' => null,
            'membership' => 'free' // Default for all users
        ];

        // Load profile data based on user type
        if ($user->user_type === 'player' && $user->player) {
            $userData['profile_image'] = $user->player->profile_image;
            $userData['membership'] = $user->player->membership ?? 'free';
        } else if ($user->user_type === 'scout' && $user->scout) {
            $userData['profile_image'] = $user->scout->profile_image;
            $userData['membership'] = $user->scout->subscription_active ? 'premium' : 'free';
        }

        return response()->json([
            "message" => "Login successful",
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user_type' => $user->user_type,
            'setup_completed' => $setupCompleted,
            'user_data' => $userData
        ]);
    }

  // Logout and revoke token
  public function logout(Request $request)
  {
      // Revoke the token that was used to authenticate the current request
      $request->user()->currentAccessToken()->delete();

      return response()->json([
          'message' => 'Logged out successfully'
      ]);
  }

    public function handleGoogleCallback(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'firstName' => 'required|string',
                'lastName' => 'required|string',
                'socialId' => 'required|string',
                'provider' => 'required|string',
                'idToken' => 'required|string',
                'user_type' => 'string|in:player,scout'
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 400);
            }

            // Check if user exists by social_id and provider first
            $user = User::with(['player', 'scout'])
                        ->where('social_id', $request->socialId)
                        ->where('provider', $request->provider)
                        ->first();

            if (!$user) {
                // Check if user exists by email
                $user = User::with(['player', 'scout'])
                            ->where('email', $request->email)
                            ->first();

                if ($user) {
                    // Update existing user with social info
                    $user->social_id = $request->socialId;
                    $user->provider = $request->provider;
                    $user->provider_token = $request->idToken;
                    $user->save();
                } else {
                    // If no user_type provided, return needs_registration flag
                    if (!$request->user_type) {
                        return response()->json([
                            'needs_registration' => true,
                            'message' => 'Please select whether you want to register as a Player or Scout'
                        ]);
                    }

                    // Generate a unique username
                    $baseUsername = strtolower(str_replace(' ', '_', $request->firstName . '_' . $request->lastName));
                    $username = $baseUsername;
                    $counter = 1;

                    while (User::where('username', $username)->exists()) {
                        $username = $baseUsername . '_' . $counter;
                        $counter++;
                    }

                    // Create new account first
                    $account = Account::create([
                        'email' => $request->email,
                        'password' => null, // No password for social login
                        'role' => 'user',
                        'is_active' => true,
                    ]);

                    // Create new user with the account's main_id
                    $user = User::create([
                        'main_id' => $account->main_id,
                        'user_type' => $request->user_type,
                        'first_name' => $request->firstName,
                        'last_name' => $request->lastName,
                        'username' => $username,
                        'email' => $request->email,
                        'social_id' => $request->socialId,
                        'provider' => $request->provider,
                        'provider_token' => $request->idToken,
                        'password' => null, // No password for social login
                        'email_verified_at' => now(),
                        'setup_completed' => false,
                    ]);
                }
            }

            // Generate token
            $token = $user->createToken('auth_token')->plainTextToken;

            // Check if user has completed setup
            $setupCompleted = $user->hasCompletedSetup();

            // Get user profile data including membership status
            $userData = [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'user_type' => $user->user_type,
                'profile_image' => null,
                'membership' => 'free' // Default for all users
            ];

            // Load profile data based on user type
            if ($user->user_type === 'player' && $user->player) {
                $userData['profile_image'] = $user->player->profile_image;
                $userData['membership'] = $user->player->membership ?? 'free';
            } else if ($user->user_type === 'scout' && $user->scout) {
                $userData['profile_image'] = $user->scout->profile_image;
                $userData['membership'] = $user->scout->subscription_active ? 'premium' : 'free';
            }

            return response()->json([
                'message' => 'Successfully logged in',
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user_type' => $user->user_type,
                'setup_completed' => $setupCompleted,
                'user_data' => $userData,
                'needs_registration' => false
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred during social login: ' . $e->getMessage()
            ], 500);
        }
    }
}
