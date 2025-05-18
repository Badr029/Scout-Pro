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
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $user = User::create([
            "user_type" => $request->user_type,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
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
            'password' => 'required|string|min:6',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Incorrect Email or Password'], 401);
        }

        $user = User::where('email', $request['email'])->firstOrFail();

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

        return response()->json([
            "message" => "Login successful",
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user_type' => $user->user_type,
            'setup_completed' => $setupCompleted
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
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'firstName' => 'required|string',
            'lastName' => 'required|string',
            'socialId' => 'required|string',
            'provider' => 'required|string',
            'idToken' => 'required|string',
            'user_type' => 'string|in:player,scout' // Make user_type optional
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        try {
            // Check if user already exists
            $user = User::where('email', $request->email)->first();

            // If user doesn't exist and no user_type provided, return special response
            if (!$user && !$request->user_type) {
                return response()->json([
                    'needs_registration' => true,
                    'user_data' => [
                        'email' => $request->email,
                        'firstName' => $request->firstName,
                        'lastName' => $request->lastName,
                        'socialId' => $request->socialId,
                        'provider' => $request->provider,
                        'idToken' => $request->idToken
                    ]
                ], 202); // 202 Accepted but needs more info
            }

            if (!$user && $request->user_type) {
                // Generate a unique username
                $username = Str::slug($request->firstName . $request->lastName) . rand(1000, 9999);
                while (User::where('username', $username)->exists()) {
                    $username = Str::slug($request->firstName . $request->lastName) . rand(1000, 9999);
                }

                // Create new user
                $user = User::create([
                    'user_type' => $request->user_type,
                    'first_name' => $request->firstName,
                    'last_name' => $request->lastName,
                    'username' => $username,
                    'email' => $request->email,
                    'social_id' => $request->socialId,
                    'provider' => $request->provider,
                    'email_verified_at' => now(), // Email is verified from Google
                    'password' => Hash::make(Str::random(24)) // Random password for social login
                ]);
            } else if ($user && $request->user_type && !$user->hasCompletedSetup()) {
                // Update existing user's type if they're trying to register with a different type
                if ($user->user_type !== $request->user_type) {
                    $user->user_type = $request->user_type;
                    $user->save();
                }
            }

            // If we have a user now, proceed with login
            if ($user) {
                Auth::login($user);
                $token = $user->createToken('auth_token')->plainTextToken;
                $setupCompleted = $user->hasCompletedSetup();

                return response()->json([
                    "message" => "Login successful",
                    'access_token' => $token,
                    'token_type' => 'Bearer',
                    'user_type' => $user->user_type,
                    'setup_completed' => $setupCompleted
                ]);
            }

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Registration failed. Please try again.',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
