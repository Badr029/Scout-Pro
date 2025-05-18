# Scout Pro Full Stack

A comprehensive scouting management system built with Laravel and Angular.

## Project Structure

This repository contains both the frontend and backend components of the Scout Pro application:

- `Scout-Pro-Front/` - Angular frontend application
- `Scout-Pro-Back/` - Laravel backend API

## Prerequisites

- PHP >= 8.2
- Node.js >= 16
- Composer
- npm or yarn
- MySQL/PostgreSQL

## Installation

### Backend Setup (Laravel)

1. Navigate to the backend directory:
   ```bash
   cd Scout-Pro-Back
   ```

2. Install PHP dependencies:
   ```bash
   composer install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Generate application key:
   ```bash
   php artisan key:generate
   ```

5. Configure your database in `.env` file

6. Run migrations:
   ```bash
   php artisan migrate
   ```

### Frontend Setup (Angular)

1. Navigate to the frontend directory:
   ```bash
   cd Scout-Pro-Front
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp src/environments/environment.example.ts src/environments/environment.ts
   ```

4. Configure your environment variables

## Development

### Running the Backend

```bash
cd Scout-Pro-Back
php artisan serve
```

### Running the Frontend

```bash
cd Scout-Pro-Front
ng serve
```

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 