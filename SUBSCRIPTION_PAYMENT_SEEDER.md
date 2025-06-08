# SubscriptionPaymentSeeder Documentation

## Overview
The SubscriptionPaymentSeeder creates realistic payment records, subscriptions, and invoices for players with premium membership and scouts with active subscriptions.

## What It Creates

### For Premium Players (membership = 'premium')
- **Payment Records**: Encrypted card details, amounts, transaction info
- **Subscriptions**: Active subscriptions with proper expiry dates
- **Regular Invoices**: Standard invoice records
- **Player Invoices**: Specific player billing records with invoice numbers

### For Active Scouts (subscription_active = true)
- **Payment Records**: Encrypted card details, amounts, transaction info
- **Subscriptions**: Active subscriptions with proper expiry dates  
- **Regular Invoices**: Standard invoice records

### Expired Subscriptions (Testing)
- Creates some expired subscriptions for free players and inactive scouts
- Useful for testing subscription renewal workflows

## Generated Data

### Sample Credit Cards (Testing Only)
```
4111111111111111 - Ahmed Hassan Mohamed (12/26, CVV: 123)
4222222222222222 - Omar Gaber Ali (11/25, CVV: 456)
4333333333333333 - Karim Hafez Ibrahim (10/27, CVV: 789)
4444444444444444 - Abdulrahman Ahmed (09/26, CVV: 321)
4555555555555555 - Khaled Mostafa (08/25, CVV: 654)
```

### Plans Used
- **Player Monthly**: 149 EGP (30 days)
- **Player Yearly**: 1529 EGP (365 days)
- **Scout Monthly**: 1399 EGP (30 days)
- **Scout Yearly**: 14279 EGP (365 days)

## Created Records

### Players with Subscriptions
- ✅ Ahmed Hassan - Player Monthly
- ✅ Omar Gaber - Player Yearly  
- ✅ Karim Hafez - Player Yearly

### Scouts with Subscriptions
- ✅ Abdulrahman Ahmed - Scout Yearly
- ✅ Khaled Mostafa - Scout Yearly
- ✅ Youssef Ismail - Scout Yearly
- ✅ Khaled Hassan - Scout Monthly
- ✅ Mostafa Hassan - Scout (Active subscription)

### Expired Subscriptions (Testing)
- ❌ Mohamed Salah Jr - Expired Player subscription
- ❌ Mahmoud Trezeguet - Expired Player subscription
- ❌ Some scouts with expired subscriptions

## Database Tables Populated

### Payments Table
- Encrypted card numbers and CVV
- Last 4 digits stored separately
- Cardholder names and expiry dates
- Payment amounts matching plan prices
- Realistic creation timestamps

### Subscriptions Table
- User and plan associations
- Payment references
- Active status based on expiry dates
- Proper start and end dates
- Plan names stored

### Invoices Table
- Payment associations
- Issue dates matching subscription start
- "Paid" status for all records

### Player Invoices Table (Players Only)
- Invoice numbers in format: PLY-YYYY-XXXXXX
- Player associations
- Payment amounts and currency (EGP)
- Paid timestamps

## Features

### Realistic Timing
- Subscription start dates are randomized (30-180 days ago)
- Expiry dates calculated from plan duration
- Some subscriptions are active, some expired

### Security
- Card numbers are encrypted using Laravel's Crypt facade
- Only last 4 digits stored in plain text
- CVV codes are encrypted

### Data Integrity
- All foreign key relationships maintained
- User, player, and scout associations correct
- Payment amounts match plan prices exactly

## Usage

### Run Individual Seeder
```bash
php artisan db:seed --class=SubscriptionPaymentSeeder
```

### Run All Seeders (Includes This One)
```bash
php artisan db:seed
```

## Integration Notes

- Must run after PlanSeeder (requires plans to exist)
- Must run after PlayerSeeder and ScoutSeeder (requires users to exist)
- Updates player and scout records with subscription IDs and expiry dates
- Creates proper invoice numbering system for players

## Testing Scenarios

### Active Subscriptions
- Premium players with valid subscriptions
- Active scouts with valid subscriptions
- Various plan types (monthly/yearly)

### Expired Subscriptions  
- Previously premium players now on free tier
- Previously active scouts now inactive
- Historical payment and invoice records

This seeder provides comprehensive test data for subscription management, payment processing, and invoice generation workflows. 