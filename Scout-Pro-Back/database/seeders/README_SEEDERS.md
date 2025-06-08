# Database Seeders Documentation

## Overview
This directory contains database seeders for the Scout Pro application. All seeders have been updated to work with the new parent accounts table system.

## ⚠️ Important Changes - Account Table Integration

All user and admin creation seeders now automatically create corresponding entries in the `accounts` table (parent table). This ensures data integrity and maintains the centralized account registry.

## Available Seeders

### 1. **PlanSeeder** 
- Creates subscription plans
- **No changes needed** - doesn't create users or admins

### 2. **AdminSeederNew** ✅ Updated
- Creates 3 admin accounts with different roles:
  - `admin@scoutpro.com` (super_admin)
  - `manager@scoutpro.com` (manager) 
  - `moderator@scoutpro.com` (moderator)
- **Now creates corresponding accounts table entries**
- **Links admins to accounts via main_id foreign key**

### 3. **PlayerSeeder** ✅ Updated
- Creates 4 player users with complete profiles:
  - Marcus Johnson (marcus.johnson@example.com)
  - Diego Silva (diego.silva@example.com) 
  - Alex Thompson (alex.thompson@example.com)
  - Jordan Williams (jordan.williams@example.com)
- **Now creates corresponding accounts table entries**
- **Links users to accounts via main_id foreign key**

### 4. **ScoutSeeder** ✅ Updated
- Creates 5 scout users with complete profiles:
  - Abdulrahman Ahmed (abdulrahman.ahmed@example.com)
  - Khaled Mostafa (khaled.mostafa@example.com)
  - Youssef Ismail (youssef.ismail@example.com)
  - Khaled Hassan (khaled.hassan@example.com)
  - Mostafa Hassan (mostafa.hassan@example.com)
- **Now creates corresponding accounts table entries**
- **Links users to accounts via main_id foreign key**

### 5. **AccountSeeder** ✅ New/Updated
- **Standalone seeder for account synchronization**
- Use only if accounts table is empty and you need to sync existing data
- Automatically skips if accounts table already has data
- Syncs existing users and admins to accounts table

### 6. **SubscriptionPaymentSeeder**
- Creates subscription and payment test data
- **No changes needed** - uses existing user/admin data

### 7. **VideoSeeder**
- Creates video test data
- **No changes needed** - uses existing user data

## Execution Order

The `DatabaseSeeder` runs seeders in this order:
1. `PlanSeeder` - Creates plans first
2. `AdminSeederNew` - Creates admins + accounts  
3. `PlayerSeeder` - Creates users + accounts
4. `ScoutSeeder` - Creates users + accounts
5. `SubscriptionPaymentSeeder` - Uses existing users/admins
6. `VideoSeeder` - Uses existing users

## Key Features

### Automatic Account Creation
- Every admin/user created automatically gets an account entry
- Proper role assignment ('admin' for admins, 'user' for users)
- Foreign key relationships maintained via `main_id`

### Data Integrity
- Email uniqueness enforced across accounts table
- Foreign key constraints ensure referential integrity
- Proper password hashing maintained

### Backward Compatibility
- Existing authentication endpoints unchanged
- All controllers continue to work with user/admin tables
- Account table acts as registry only

## Usage

### Fresh Installation
```bash
php artisan migrate:fresh --seed
```

### Run Individual Seeders
```bash
php artisan db:seed --class=AdminSeederNew
php artisan db:seed --class=PlayerSeeder
php artisan db:seed --class=ScoutSeeder
```

### Sync Existing Data (if needed)
```bash
php artisan db:seed --class=AccountSeeder
```

## Account Data Structure

Each account entry contains:
- `main_id` (primary key)
- `email` (unique across all accounts)
- `password` (hashed)
- `role` ('user' or 'admin')
- `is_active` (boolean)
- `created_at` / `updated_at`

## Relationships

```
accounts (parent table)
├── users (main_id foreign key)
└── admins (main_id foreign key)
```

## Testing

All seeders have been tested to:
- ✅ Create accounts entries properly
- ✅ Link via foreign keys correctly  
- ✅ Maintain data integrity
- ✅ Handle duplicate prevention
- ✅ Preserve existing functionality

## Notes

- **Password Policy**: Only users/admins with passwords get account entries (skips social login users with null passwords)
- **Duplicate Handling**: Seeders will fail gracefully if trying to create duplicate email accounts
- **Console Output**: Enhanced logging shows account creation with IDs for verification
- **Foreign Key**: `main_id` column added to both users and admins tables
