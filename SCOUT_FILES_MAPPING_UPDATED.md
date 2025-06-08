# Scout Files Mapping - Updated

## Overview
This document shows the updated mapping between scout files in Laravel storage and how they are referenced in the ScoutSeeder.

## Storage Location
**Base Path**: `Scout-Pro-Back/storage/app/public/scouts/Scouts/`

## File Mapping

### 1. Abdulrahman Ahmed
- **Profile Image**: `scouts/Scouts/Profile images/Abdulrahman Ahmed .png`
- **ID Proof**: `scouts/Scouts/IDs/Abdulrahman Ahmed .png`
- **Certificate**: `scouts/Scouts/Certificates/ChatGPT Image Jun 8, 2025, 06_09_08 PM.png`

### 2. Khaled Mostafa
- **Profile Image**: `scouts/Scouts/Profile images/Khaled Mostafa .png`
- **ID Proof**: `scouts/Scouts/IDs/Khaled Mostafa.png`
- **Certificate**: `scouts/Scouts/Certificates/ChatGPT Image Jun 8, 2025, 06_03_27 PM.png`

### 3. Youssef Ismail
- **Profile Image**: `scouts/Scouts/Profile images/Youssef Ismail.png`
- **ID Proof**: `scouts/Scouts/IDs/Youssef Ismail.png`
- **Certificate**: `scouts/Scouts/Certificates/ChatGPT Image Jun 8, 2025, 06_00_26 PM.png`

### 4. Khaled Hassan
- **Profile Image**: `scouts/Scouts/Profile images/khaled Hassan.png`
- **ID Proof**: `scouts/Scouts/IDs/khaled Hassan.png`
- **Certificate**: `scouts/Scouts/Certificates/ChatGPT Image Jun 8, 2025, 05_57_56 PM.png`

### 5. Mostafa Hassan
- **Profile Image**: `scouts/Scouts/Profile images/Mostafa Hassan .png`
- **ID Proof**: `scouts/Scouts/IDs/Mostafa Hassan .png`
- **Certificate**: `scouts/Scouts/Certificates/ChatGPT Image Jun 8, 2025, 06_10_40 PM.png`

## Directory Structure
```
Scout-Pro-Back/storage/app/public/scouts/Scouts/
├── Profile images/
│   ├── Abdulrahman Ahmed .png
│   ├── Khaled Mostafa .png
│   ├── Youssef Ismail.png
│   ├── khaled Hassan.png
│   └── Mostafa Hassan .png
├── IDs/
│   ├── Abdulrahman Ahmed .png
│   ├── Khaled Mostafa.png
│   ├── Youssef Ismail.png
│   ├── khaled Hassan.png
│   └── Mostafa Hassan .png
└── Certificates/
    ├── ChatGPT Image Jun 8, 2025, 05_57_56 PM.png
    ├── ChatGPT Image Jun 8, 2025, 06_00_26 PM.png
    ├── ChatGPT Image Jun 8, 2025, 06_03_27 PM.png
    ├── ChatGPT Image Jun 8, 2025, 06_09_08 PM.png
    └── ChatGPT Image Jun 8, 2025, 06_10_40 PM.png
```

## Notes
- Files are now properly organized in Laravel's storage directory
- Certificate files use ChatGPT timestamp format instead of scout names
- All profile images and IDs maintain scout name format with proper spacing
- File paths are relative to Laravel's storage/app/public directory
- Files can be accessed via Laravel's storage URL helper 