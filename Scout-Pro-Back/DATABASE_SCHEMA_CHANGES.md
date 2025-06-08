# Database Schema Changes - Admin Separation & Video Player Association

## Overview
This update separates admin users from regular users (scouts and players) and associates videos directly with players while maintaining backward compatibility.

## Changes Made

### 1. New `admins` Table
- **Purpose**: Separate admin users from regular users
- **Fields**:
  - `id` - Primary key
  - `first_name`, `last_name` - Admin name
  - `username` - Unique username
  - `email` - Unique email
  - `password` - Hashed password
  - `role` - 'admin' or 'super_admin'
  - `profile_image` - Optional profile image path
  - `is_active` - Boolean for account status
  - `last_login_at` - Last login timestamp
  - Standard Laravel timestamps

### 2. Modified `users` Table
- **Change**: Removed 'admin' from `user_type` enum
- **Current Types**: 'player', 'scout'
- **Migration**: Existing admin users are automatically migrated to the new `admins` table

### 3. Enhanced `videos` Table
- **Added**: `player_id` foreign key (nullable)
- **Purpose**: Direct association between videos and players
- **Compatibility**: Keeps `user_id` for backward compatibility
- **Indexes**: Added performance indexes for video queries

## New Models

### Admin Model (`App\Models\Admin`)
- Extends `Authenticatable` for login capabilities
- Uses Sanctum for API authentication
- Helper methods: `isSuperAdmin()`, `isActive()`, `updateLastLogin()`
- Full name accessor: `getFullNameAttribute()`

## Updated Models

### Video Model
- Added `player()` relationship
- Maintains `user()` relationship for compatibility
- Updated fillable fields to include `player_id`

### Player Model
- Updated `videos()` relationship to use Video model
- All video-related methods work with new structure

## New Controllers

### AdminAuthController (`App\Http\Controllers\API\AdminAuthController`)
- `login()` - Admin authentication
- `logout()` - Token revocation
- `me()` - Get current admin info
- `changePassword()` - Password management
- `updateProfile()` - Profile updates

## New Middleware

### AdminAuth (`App\Http\Middleware\AdminAuth`)
- Ensures only authenticated admins access admin routes
- Validates admin account status

### SuperAdminAuth (`App\Http\Middleware\SuperAdminAuth`)
- Restricts access to super admin only routes
- Includes all AdminAuth validations

## Migrations

1. **2025_06_08_172720_create_admins_table.php**
   - Creates the new admins table

2. **2025_06_08_172735_add_player_id_to_videos_table.php**
   - Adds player_id column to videos table
   - Adds performance indexes

3. **2025_06_08_172743_modify_users_table_remove_admin_type.php**
   - Migrates existing admin users to admins table
   - Updates user_type enum

4. **2025_06_08_173318_populate_player_id_in_videos_table.php**
   - Populates player_id for existing videos

5. **2025_06_08_173608_update_existing_videos_with_player_id.php**
   - Data migration to set player_id based on user relationships

## Updated Seeders

### AdminSeederNew
- Creates default admin accounts in the new admins table
- Default accounts:
  - Super Admin: admin@scoutpro.com / password
  - Manager: manager@scoutpro.com / password
  - Moderator: moderator@scoutpro.com / password

### VideoSeeder
- Updated to include `player_id` when creating videos
- Maintains compatibility with existing structure

## Controller Updates

### VideoController
- Updated `store()` and `upload()` methods to include `player_id`
- Maintains all existing functionality
- No breaking changes to API responses

## Backward Compatibility

✅ **Maintained**:
- All existing API endpoints work unchanged
- Video queries work with both `user_id` and `player_id`
- User authentication remains the same for players/scouts
- Frontend requires no immediate changes

✅ **Enhanced**:
- Better performance with direct player-video relationships
- Cleaner admin management system
- Improved security with separate admin authentication

## Usage Examples

### Admin Authentication
```php
// Login
POST /api/admin/login
{
    "email": "admin@scoutpro.com",
    "password": "password"
}

// Get admin info
GET /api/admin/me
Authorization: Bearer {admin_token}
```

### Video Queries (Enhanced)
```php
// Get videos by player (new way)
$videos = Video::where('player_id', $playerId)->get();

// Get videos by user (still works)
$videos = Video::where('user_id', $userId)->get();

// Get player's videos through relationship
$player = Player::find($playerId);
$videos = $player->videos;
```

## Migration Commands

```bash
# Run all migrations
php artisan migrate

# Seed new admin accounts
php artisan db:seed --class=AdminSeederNew

# Full database refresh with new structure
php artisan migrate:fresh --seed
``` 
