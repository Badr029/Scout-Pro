# Scout Pro Full Stack
A comprehensive football scouting and talent management platform built with Laravel and Angular. Connect players with professional scouts, showcase talent through video profiles, and discover opportunities in the world of football.

## 🚀 Features

### 🎯 Core Platform Features

- **Dynamic Welcome Page** - Beautiful landing page with animated elements, feature showcases, testimonials, and statistics
- **User Authentication** - Complete auth system with Google OAuth integration, email verification, and password reset
- **Dual User Types** - Separate experiences for Players and Scouts with tailored functionalities
- **Real-time Feed** - Interactive video feed with likes, comments, views, and social features
- **Advanced Search** - Powerful search and filtering capabilities for discovering talent
- **Notification System** - Real-time notifications for all user interactions and system updates

### 👨‍💼 Admin Dashboard

- **Comprehensive Statistics** - User growth, engagement metrics, video analytics, and revenue tracking
- **Contact Request Management** - Approve/reject scout-to-player contact requests with email notifications
- **Event Management** - Create and approve scouting events, tournaments, and trials
- **Subscription Management** - Complete control over user subscriptions with activate/deactivate/cancel functionality
- **User Management** - View, manage, and moderate all platform users
- **Content Moderation** - Manage videos, comments, and user-generated content
- **Payment Tracking** - Monitor all transactions, invoices, and revenue analytics

### 🏃‍♂️ Player Features

- **Profile Creation** - Comprehensive player profiles with personal info, statistics, and achievements
- **Video Portfolio** - Upload and manage HD video highlights with performance analytics
- **Talent Discovery** - Get discovered by verified professional scouts worldwide
- **Premium Membership** - Enhanced visibility and exclusive features for premium players
- **Event Participation** - Join exclusive tournaments and scouting events
- **Performance Analytics** - Track video views, likes, and scout interactions

### 🔍 Scout Features

- **Advanced Scouting Tools** - AI-powered talent identification and player matching algorithms
- **Contact System** - Direct messaging with players through admin-moderated contact requests
- **Event Organization** - Create and manage scouting events and tournaments
- **Professional Verification** - Document verification system for scout credentials
- **Subscription Plans** - Access premium scouting features and expanded player database
- **Analytics Dashboard** - Track scouting activities and player interactions

### 📱 Technical Features

- **Responsive Design** - Fully responsive across desktop, tablet, and mobile devices
- **Progressive Web App** - Mobile-optimized experience with offline capabilities
- **Real-time Updates** - Live notifications and feed updates
- **Video Streaming** - Optimized video upload, processing, and streaming
- **Payment Integration** - Secure payment processing for subscriptions
- **Email Notifications** - Automated email system for all user interactions
- **API Documentation** - Comprehensive RESTful API

## 🏗️ Project Structure

```
Scout-Pro-FullStack/
├── Scout-Pro-Front/          # Angular Frontend Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin-dashboard/     # Admin panel components
│   │   │   ├── dynamic-welcome/     # Landing page
│   │   │   ├── feed/                # Main feed interface
│   │   │   ├── static-pages/        # About, Features, etc.
│   │   │   ├── shared/              # Shared components & services
│   │   │   └── ...
│   │   └── environments/
│   └── ...
└── Scout-Pro-Back/           # Laravel Backend API
    ├── app/
    │   ├── Http/Controllers/API/    # API Controllers
    │   ├── Models/                  # Eloquent Models
    │   ├── Mail/                    # Email Templates
    │   └── Traits/                  # Reusable Traits
    ├── database/
    │   ├── migrations/              # Database Migrations
    │   └── seeders/                 # Database Seeders
    └── routes/
                 └── api.php                  # API Routes
```

## 🛠️ Prerequisites

- **PHP** >= 8.2
- **Node.js** >= 16
- **Composer** >= 2.0
- **Angular CLI** >= 15
- **MySQL** >= 8.0 or **PostgreSQL** >= 13
- **FFmpeg** (for video processing)

## 📦 Dependencies

### Backend Dependencies (Laravel/PHP)

#### Production Dependencies
```json
{
  "php": "^8.2",
  "guzzlehttp/guzzle": "^7.9",
  "laravel/framework": "^12.0",
  "laravel/sanctum": "^4.0",
  "laravel/socialite": "^5.20",
  "laravel/tinker": "^2.10.1"
}
```

#### Development Dependencies
```json
{
  "fakerphp/faker": "^1.23",
  "laravel/pail": "^1.2.2",
  "laravel/pint": "^1.13",
  "laravel/sail": "^1.41",
  "mockery/mockery": "^1.6",
  "nunomaduro/collision": "^8.6",
  "phpunit/phpunit": "^11.5.3"
}
```

**Key Backend Packages:**
- **Laravel Framework 12.0** - Core PHP framework
- **Laravel Sanctum** - API token authentication
- **Laravel Socialite** - OAuth integration (Google, Facebook)
- **Guzzle HTTP** - HTTP client for API requests
- **Laravel Tinker** - Interactive PHP REPL
- **PHPUnit** - Testing framework
- **Laravel Pint** - PHP code style fixer
- **Faker** - Generate fake data for testing

### Frontend Dependencies (Angular/TypeScript)

#### Production Dependencies
```json
{
  "@abacritt/angularx-social-login": "^2.4.0",
  "@angular/animations": "^19.2.0",
  "@angular/common": "^19.2.0",
  "@angular/compiler": "^19.2.0",
  "@angular/core": "^19.2.0",
  "@angular/forms": "^19.2.0",
  "@angular/platform-browser": "^19.2.0",
  "@angular/platform-browser-dynamic": "^19.2.0",
  "@angular/router": "^19.2.0",
  "@flaticon/flaticon-uicons": "^3.3.1",
  "@fortawesome/fontawesome-free": "^6.7.2",
  "@types/pusher-js": "^4.2.2",
  "chart.js": "^4.4.9",
  "gapi-script": "^1.2.0",
  "ngx-toastr": "^19.0.0",
  "pusher-js": "^8.4.0",
  "rxjs": "~7.8.0",
  "tslib": "^2.3.0",
  "zone.js": "~0.15.0"
}
```

#### Development Dependencies
```json
{
  "@angular-devkit/build-angular": "^19.2.10",
  "@angular/cli": "^19.2.10",
  "@angular/compiler-cli": "^19.2.0",
  "@types/google.maps": "^3.58.1",
  "@types/jasmine": "~5.1.0",
  "jasmine-core": "~5.6.0",
  "karma": "~6.4.0",
  "karma-chrome-launcher": "~3.2.0",
  "karma-coverage": "~2.2.0",
  "karma-jasmine": "~5.1.0",
  "karma-jasmine-html-reporter": "~2.1.0",
  "typescript": "~5.7.2"
}
```

**Key Frontend Packages:**
- **Angular 19.2** - Core frontend framework
- **Chart.js** - Interactive charts and analytics
- **FontAwesome** - Icon library
- **Flaticon UI Icons** - Additional icon set
- **NGX Toastr** - Toast notifications
- **Angular Social Login** - OAuth integration
- **Pusher.js** - Real-time notifications
- **Google API Script** - Google services integration
- **RxJS** - Reactive programming
- **Jasmine & Karma** - Testing frameworks
- **TypeScript 5.7** - Type-safe JavaScript

## 🔧 Dependency Installation

### Install Backend Dependencies

```bash
cd Scout-Pro-Back

# Install all PHP dependencies via Composer
composer install

# Install specific packages (if needed individually)
composer require laravel/sanctum
composer require laravel/socialite
composer require guzzlehttp/guzzle

# Install development dependencies
composer require --dev fakerphp/faker
composer require --dev laravel/pint
composer require --dev phpunit/phpunit
composer require --dev mockery/mockery
```

### Install Frontend Dependencies

```bash
cd Scout-Pro-Front

# Install all Node dependencies via npm
npm install

# Or using yarn
yarn install

# Install specific packages (if needed individually)
npm install @angular/core@^19.2.0
npm install @angular/router@^19.2.0
npm install @fortawesome/fontawesome-free
npm install chart.js
npm install ngx-toastr
npm install pusher-js
npm install @abacritt/angularx-social-login

# Install Angular CLI globally (if not already installed)
npm install -g @angular/cli@latest
```

### Additional System Dependencies

```bash

# Install FFmpeg (macOS with Homebrew)
brew install ffmpeg

# Install FFmpeg (Windows with Chocolatey)
choco install ffmpeg

# Verify FFmpeg installation
ffmpeg -version
```

### Database Setup

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE scout_pro;
CREATE USER 'scout_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON scout_pro.* TO 'scout_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Or using PostgreSQL
sudo -u postgres psql
CREATE DATABASE scout_pro;
CREATE USER scout_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE scout_pro TO scout_user;
\q
```

### Update Dependencies

```bash
# Update backend dependencies
cd Scout-Pro-Back
composer update

# Update frontend dependencies
cd Scout-Pro-Front
npm update

# Check for outdated packages
npm outdated
composer outdated
```

### Install Additional Tools

```bash
# Install Laravel installer globally
composer global require laravel/installer

# Install useful Laravel packages
cd Scout-Pro-Back
composer require laravel/horizon          # Queue monitoring
composer require spatie/laravel-permission # Role permissions
composer require intervention/image        # Image manipulation

# Install useful Angular packages
cd Scout-Pro-Front
npm install @angular/cdk                  # Component Dev Kit
npm install @angular/material             # Material Design
npm install ngx-spinner                   # Loading spinners
npm install ng2-file-upload              # File uploads
```

## 📦 Installation

### Backend Setup (Laravel)

1. **Navigate to the backend directory:**
   ```bash
   cd Scout-Pro-Back
   ```

2. **Install PHP dependencies:**
   ```bash
   composer install
   ```

3. **Create and configure environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Generate application key:**
   ```bash
   php artisan key:generate
   ```

5. **Configure your database and services in `.env` file:**
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=scoutpro
   DB_USERNAME=your_username
   DB_PASSWORD=your_password

   # Email Configuration
   MAIL_MAILER=smtp
   MAIL_HOST=your_smtp_host
   MAIL_PORT=587
   MAIL_USERNAME=your_email
   MAIL_PASSWORD=your_password

   # Google OAuth (Optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

6. **Create database and run migrations:**
   ```bash
   php artisan migrate
   ```

7. **Seed initial data (optional):**
   ```bash
   php artisan db:seed
   ```

8. **Create storage symlink:**
   ```bash
   php artisan storage:link
   ```

### Frontend Setup (Angular)

1. **Navigate to the frontend directory:**
   ```bash
   cd Scout-Pro-Front
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp src/environments/environment.example.ts src/environments/environment.ts
   ```

4. **Update environment variables:**
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:8000/api',
     googleClientId: 'your_google_client_id'
   };
   ```

## 🚀 Development

### Running the Backend

```bash
cd Scout-Pro-Back
php artisan serve
```
The API will be available at `http://localhost:8000`

### Running the Frontend

```bash
cd Scout-Pro-Front
ng serve
```
The application will be available at `http://localhost:4200`

### Running Both (Concurrent)

You can run both frontend and backend simultaneously using separate terminal windows or use a process manager like PM2.

## 🔧 Configuration

### Email Setup
Configure SMTP settings in `.env` for email notifications:
- Contact request approvals/rejections
- Event notifications
- Subscription updates
- Welcome emails

### Video Storage
Configure file storage for video uploads:
- Local storage (default)
- AWS S3 (recommended for production)
- Other cloud storage providers

### Payment Integration
Set up payment processing:
- Stripe integration for subscriptions
- PayPal support
- Invoice generation

## 📊 Database Schema

Key database tables include:
- `users` - User accounts (players, scouts, admins)
- `players` - Player-specific profile data
- `scouts` - Scout-specific profile data
- `videos` - Video uploads and metadata
- `subscriptions` - User subscription management
- `contact_requests` - Scout-to-player contact requests
- `events` - Scouting events and tournaments
- `notifications` - Real-time notification system

## 🔐 Security Features

- **CSRF Protection** - Cross-site request forgery protection
- **Rate Limiting** - API rate limiting to prevent abuse
- **Input Validation** - Comprehensive input validation and sanitization
- **File Upload Security** - Secure file upload with type and size validation
- **Authentication Guards** - Role-based access control
- **SQL Injection Prevention** - Eloquent ORM protection

## 🎨 UI/UX Features

- **Dark Theme** - Modern dark theme throughout the application
- **Responsive Design** - Mobile-first responsive design
- **Smooth Animations** - CSS animations and transitions
- **Interactive Components** - Rich user interactions
- **Accessibility** - WCAG compliance and screen reader support
- **Progressive Enhancement** - Works without JavaScript (where possible)

## 🚀 Deployment

### Production Deployment

1. **Backend Deployment:**
   - Set up production server (nginx/Apache)
   - Configure SSL certificates
   - Set environment to production
   - Configure caching and optimization
   - Set up queue workers for background jobs

2. **Frontend Deployment:**
   - Build production version: `ng build --prod`
   - Deploy to CDN or static hosting
   - Configure proper routing

3. **Database:**
   - Run production migrations
   - Set up database backups
   - Configure database optimization

## 🤝 Contributing

We welcome contributions to Scout Pro! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow PSR-12 coding standards for PHP
- Use Angular style guide for TypeScript/Angular code
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure responsive design compatibility

## 📝 API Documentation

The API follows RESTful conventions with the following main endpoints:

- **Authentication:** `/api/auth/*`
- **Users:** `/api/users/*`
- **Videos:** `/api/videos/*`
- **Feed:** `/api/feed/*`
- **Subscriptions:** `/api/subscription/*`
- **Admin:** `/api/admin/*`
- **Events:** `/api/events/*`

For detailed API documentation, visit `/api/documentation` when running the application.

## 🐛 Troubleshooting

### Common Issues

1. **Video Upload Fails:**
   - Check file size limits in PHP configuration
   - Verify FFmpeg installation
   - Check storage permissions

2. **Email Not Sending:**
   - Verify SMTP configuration
   - Check firewall settings
   - Confirm email credentials

3. **Authentication Issues:**
   - Clear browser cache and cookies
   - Verify JWT token configuration
   - Check API endpoint accessibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Laravel community for the excellent framework
- Angular team for the powerful frontend framework
- Contributors and beta testers
- Football scouting professionals who provided insights

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: support@scoutpro.com
- Documentation: [docs.scoutpro.com](https://docs.scoutpro.com)

---

**Scout Pro** - Transforming Football Dreams Into Professional Reality 🚀⚽ 

# Hi there 👋! I'm Badr - Full Stack Developer

<div align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&pause=1000&color=2C9AD1&random=false&width=435&lines=Full+Stack+Developer;Laravel+%2B+Angular+Developer;Always+learning+new+things" alt="Typing SVG" />
</div>

## 👨‍💻 About Me

I'm a passionate Full Stack Developer specializing in Laravel and Angular development. Currently working on Scout Pro, a platform connecting sports scouts with talented players.

<!-- - 🔭 I'm currently working on **Scout Pro Full Stack Application** -->
- 🌱 I'm currently learning **Advanced Angular Patterns and Laravel Best Practices**
- 👯 I'm looking to collaborate on **Open Source Projects**
- 💬 Ask me about **Laravel, Angular, Full Stack Development**
- 📍 Based in Egypt
- ⚡ Fun fact: I love football and coding equally! ⚽💻

## 🛠️ Tech Stack

<div align="center">

### Backend Development
![PHP](https://img.shields.io/badge/-PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)
![Laravel](https://img.shields.io/badge/-Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![MySQL](https://img.shields.io/badge/-MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

### Frontend Development
![Angular](https://img.shields.io/badge/-Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![HTML5](https://img.shields.io/badge/-HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/-CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![SCSS](https://img.shields.io/badge/-SCSS-CC6699?style=for-the-badge&logo=sass&logoColor=white)

### Tools & Technologies
![Git](https://img.shields.io/badge/-Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/-GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
![VS Code](https://img.shields.io/badge/-VS%20Code-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white)
![Postman](https://img.shields.io/badge/-Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)

</div>

## 📊 GitHub Stats

<div align="center">
  <img src="https://github-readme-stats.vercel.app/api?username=Badr029&show_icons=true&theme=radical" alt="Badr's GitHub stats" />
</div>

<div align="center">
  <img src="https://github-readme-streak-stats.herokuapp.com/?user=Badr029&theme=radical" alt="GitHub Streak" />
</div>

<div align="center">
  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=Badr029&layout=compact&theme=radical" alt="Top Languages" />
</div>

## 🤝 Let's Connect!

<div align="center">

[![LinkedIn](https://img.shields.io/badge/-LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/YOUR_LINKEDIN)
[![Twitter](https://img.shields.io/badge/-Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/YOUR_TWITTER)
[![Instagram](https://img.shields.io/badge/-Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://instagram.com/YOUR_INSTAGRAM)
[![Facebook](https://img.shields.io/badge/-Facebook-1877F2?style=for-the-badge&logo=facebook&logoColor=white)](https://facebook.com/YOUR_FACEBOOK)
[![Email](https://img.shields.io/badge/-Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:YOUR_EMAIL)

</div>

## 🎯 Featured Projects

<div align="center">

[![Scout Pro](https://github-readme-stats.vercel.app/api/pin/?username=Badr029&repo=Scout-Pro-FullStack&theme=radical)](https://github.com/Badr029/Scout-Pro-FullStack)

</div>

---

<div align="center">
  <img src="https://komarev.com/ghpvc/?username=Badr029&color=blueviolet&style=for-the-badge" alt="Profile views" />
</div>

<div align="center">
  
  ![Snake animation](https://github.com/Badr029/Badr029/blob/output/github-contribution-grid-snake.svg)
  
</div>
