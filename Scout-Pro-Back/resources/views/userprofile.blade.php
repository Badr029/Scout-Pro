<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Player Profile</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background-color: #f8f8f8;
      margin: 0;
      padding: 20px;
      position: relative;
    }

    .profile-container {
      background-color: #fff;
      max-width: 900px;
      margin: auto;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .profile-header {
      display: flex;
      gap: 20px;
      align-items: center;
      margin-bottom: 30px;
    }

    .profile-pic {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background-color: #ccc;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .profile-pic img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .player-details h1 {
      margin: 0;
      font-size: 28px;
      color: #333;
    }

    .player-details p {
      margin: 5px 0;
      color: #555;
    }

    .menu {
      display: flex;
      gap: 15px;
      margin: 20px 0;
    }

    .menu button {
      background-color: #eee;
      border: none;
      padding: 10px 20px;
      border-radius: 20px;
      cursor: pointer;
      transition: 0.2s;
    }

    .menu button.active {
      background-color: #333;
      color: #fff;
    }

    .section {
      display: none;
      margin-top: 20px;
    }

    .section.active {
      display: block;
    }

    ul {
      list-style: none;
      padding: 0;
    }

    li {
      margin: 8px 0;
      color: #444;
    }

    li strong {
      color: #222;
    }

    .upload-form {
      margin-bottom: 20px;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .video-item {
      margin-bottom: 20px;
      padding: 15px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .file-error {
      color: red;
      font-size: 0.8em;
      margin-top: 5px;
    }

    #uploadProgress {
      margin-top: 10px;
      display: none;
    }

    /* Settings Icon */
    .settings-icon {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: #333;
      color: white;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 1000;
      transition: transform 0.3s;
    }

    .settings-icon:hover {
      transform: rotate(30deg);
    }

    /* Settings Sidebar */
    .settings-sidebar {
      position: fixed;
      top: 0;
      right: -350px;
      width: 300px;
      height: 100vh;
      background: white;
      box-shadow: -2px 0 10px rgba(0,0,0,0.1);
      transition: right 0.3s ease;
      z-index: 999;
      padding: 20px;
      overflow-y: auto;
    }

    .settings-sidebar.active {
      right: 0;
    }

    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }

    .close-sidebar {
      font-size: 24px;
      cursor: pointer;
    }

    .sidebar-menu {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .sidebar-menu li {
      margin: 15px 0;
    }

    .sidebar-menu a {
      display: block;
      padding: 10px;
      color: #333;
      text-decoration: none;
      border-radius: 5px;
      transition: background 0.2s;
    }

    .sidebar-menu a:hover {
      background: #f5f5f5;
    }

    .logout-btn {
      background: none;
      border: none;
      color: #333;
      font-size: 16px;
      cursor: pointer;
      padding: 10px;
      width: 100%;
      text-align: left;
    }

    .logout-btn:hover {
      background: #f5f5f5;
    }

    /* Overlay */
    .sidebar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 998;
      display: none;
    }

    @media (max-width: 768px) {
      .profile-header {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .settings-sidebar {
        width: 250px;
      }
    }
  </style>
</head>
<body>
  <div class="profile-container">
    <div class="profile-header">
      <div class="profile-pic">
        @if($player && $player->profile_image)
          <img src="{{ asset('storage/' . $player->profile_image) }}" alt="Profile Image">
        @else
          <span>No Image</span>
        @endif
      </div>
      <div class="player-details">
        <h1></h1>

        @if($player)
          <p><strong><h1>{{ $user->first_name }} {{ $user->last_name }}</h1></strong></p>

          <p><strong>Age:</strong> {{ $age ?? 'N/A' }} ({{ $player->DateofBirth }})</p>
          <p><strong>Height:</strong> {{ $player->height ?? 'N/A' }}</p>
          <p><strong>Position:</strong> {{ $player->position ?? 'N/A' }}</p>
        @endif
      </div>
    </div>

    @if($player)
    <div class="menu">
      <button class="tab-btn active" data-tab="about">About</button>
      <button class="tab-btn" data-tab="videos">Videos</button>
      <button class="tab-btn" data-tab="stats">Stats</button>
      <button class="tab-btn" data-tab="career">Career</button>
    </div>

    <!-- About Section -->
    <div id="about" class="section active">
      <h2>About</h2>

      <p class="description">{{ $player->bio ?? 'No description available' }}</p>
      @if($player->position == 'goalkeeper')
      <ul>
        <li><strong>Nationality:</strong> {{ $player->nationality ?? 'null' }}</li>
        <li><strong>Market Value:</strong> {{ $player->market_value ?? 'null' }}</li>
        <li><strong>Current Club:</strong> {{ $player->current_club ?? 'null' }}</li>
      </ul>
      @else
      <ul>
        <li><strong>Nationality:</strong> {{ $player->nationality ?? 'null' }}</li>
        <li><strong>Market Value:</strong> {{ $player->market_value ?? 'null' }}</li>
        <li><strong>Current Club:</strong> {{ $player->current_club ?? 'null' }}</li>
        <li><strong>Preferred Foot:</strong> {{ $player->preferred_foot ?? 'null' }}</li>
      </ul>
      @endif
    </div>

    <!-- Videos Section -->
    <div id="videos" class="section">
      <h2>Videos</h2>

      @if($errors->any())
        <div class="alert alert-danger">
          @foreach($errors->all() as $error)
            <p class="file-error">{{ $error }}</p>
          @endforeach
        </div>
      @endif

      @if(auth()->check() && auth()->user()->player && auth()->user()->player->id == $player->id)
      <div class="upload-form">
        <h3>Upload New Video</h3>
        <form method="POST" action="{{ route('posts.store') }}" enctype="multipart/form-data" id="videoUploadForm">
          @csrf
          <div style="margin-bottom: 10px;">
            <input type="text" name="title" placeholder="Video title" required
                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div style="margin-bottom: 10px;">
            <textarea name="description" placeholder="Description"
                      style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
          </div>
          <div style="margin-bottom: 10px;">
            <input type="file" name="video" id="videoUpload" accept="video/mp4,video/mov,video/avi" required>
            <small style="display: block; margin-top: 5px; color: #666;">Max 50MB (MP4, MOV, AVI)</small>
            <div class="file-error" id="fileError"></div>
          </div>
          <div id="uploadProgress">
            <progress value="0" max="100" style="width: 100%"></progress>
            <span id="progressText">0%</span>
          </div>
          <button type="submit"
                  style="background: #333; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
            Upload Video
          </button>
        </form>
      </div>
      @endif

      <div class="video-list">
        @if($player->posts && $player->posts->count() > 0)
          @foreach($player->posts as $post)
            @if($post->video_url)
            <div class="video-item">
              <h3>{{ $post->title }}</h3>
              <p>{{ $post->description }}</p>
              <video width="100%" controls style="max-width: 600px;">
                <source src="{{ $post->video_url }}" type="video/mp4">
                Your browser doesn't support videos.
              </video>
              <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <span>👍 {{ $post->likes_count }} Likes</span> |
                  <span>💬 {{ $post->comments_count }} Comments</span>
                </div>
                <div>
                  <span>📅 {{ $post->created_at->format('M d, Y') }}</span>
                  @if(auth()->check() && auth()->user()->player && auth()->user()->player->id == $player->id)
                  <form method="POST" action="{{ route('posts.destroy', $post) }}" style="display: inline;">
                    @csrf
                    @method('DELETE')
                    <button type="submit" style="background: #dc3545; color: white; border: none; padding: 2px 8px; border-radius: 3px; margin-left: 10px;">
                      Delete
                    </button>
                  </form>
                  @endif
                </div>
              </div>
            </div>
            @endif
          @endforeach
        @else
          <p>No videos available yet</p>
        @endif
      </div>
    </div>

    <!-- Stats Section -->
    <div id="stats" class="section">
      <h2>Stats</h2>
      @if($player->position == 'goalkeeper')
        <p><strong>Goals Saved:</strong> {{ $goalkeeper->saves ?? 'N/A' }}</p>
        <p><strong>Clean Sheets:</strong> {{ $goalkeeper->clean_sheets ?? 'N/A' }}</p>
        <p><strong>Yellow Cards:</strong> {{ $player->yellow_cards ?? 'N/A' }}</p>
        <p><strong>Red Cards:</strong> {{ $player->red_cards ?? 'N/A' }}</p>
        <li><strong>endurance:</strong> {{ $player->endurance ?? 'null' }}</li>
      @else
        <p><strong>Goals Scored:</strong> {{ $outfield->goals ?? 'N/A' }}</p>
        <p><strong>Assists:</strong> {{ $outfield->assists ?? 'N/A' }}</p>
        <p><strong>Shots on Target:</strong> {{ $outfield->shots_on_target ?? 'N/A' }}</p>
        <p><strong>Speed:</strong> {{ $outfield->speed ?? 'N/A' }}</p>
        <p><strong>Passing Accuracy:</strong> {{ $outfield->shots_on_target ?? 'N/A' }}</p>
        <p><strong>Yellow Cards:</strong> {{ $player->yellow_cards ?? 'N/A' }}</p>
        <p><strong>Red Cards:</strong> {{ $player->red_cards ?? 'N/A' }}</p>
      @endif
    </div>

    <!-- Career Section -->
    <div id="career" class="section">
      <h2>Career</h2>
      @if($player->career_history)
        <p>Career history coming soon</p>
      @else
        <p>No career history available</p>
      @endif
    </div>
    @endif
  </div>

  <!-- Settings Icon -->
  <div class="settings-icon" id="settingsIcon">
    ⚙️
  </div>

  <!-- Settings Sidebar -->
  <div class="settings-sidebar" id="settingsSidebar">
    <div class="sidebar-header">
      <h3>Settings</h3>
      <span class="close-sidebar" id="closeSidebar">&times;</span>
    </div>
    <ul class="sidebar-menu">
      <li><a href="{{url('edit') }}" id="editProfileBtn">Edit Profile</a></li>
      <li><a href="#" id="subscriptionBtn">Subscription</a></li>
      <li>
        <form method="POST" action="{{ route('logout') }}">
          @csrf
          <button type="submit" class="logout-btn">Logout</button>
        </form>
      </li>
    </ul>
  </div>

  <!-- Overlay -->
  <div class="sidebar-overlay" id="sidebarOverlay"></div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Tab switching
      const buttons = document.querySelectorAll(".tab-btn");
      const sections = document.querySelectorAll(".section");

      buttons.forEach(btn => {
        btn.addEventListener("click", () => {
          buttons.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");

          sections.forEach(sec => {
            sec.classList.remove("active");
            if (sec.id === btn.dataset.tab) {
              sec.classList.add("active");
            }
          });
        });
      });

      // File size validation
      document.getElementById('videoUpload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        const errorElement = document.getElementById('fileError');

        if (file && file.size > 50 * 1024 * 1024) { // 50MB
          errorElement.textContent = 'File must be smaller than 50MB';
          e.target.value = ''; // Clear the file input
        } else {
          errorElement.textContent = '';
        }
      });

      // Upload progress
      const form = document.getElementById('videoUploadForm');
      if (form) {
        form.addEventListener('submit', function(e) {
          const progressDiv = document.getElementById('uploadProgress');
          progressDiv.style.display = 'block';

          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              document.querySelector('progress').value = percent;
              document.getElementById('progressText').textContent = percent + '%';
            }
          });
        });
      }

      const settingsIcon = document.getElementById('settingsIcon');
      const settingsSidebar = document.getElementById('settingsSidebar');
      const closeSidebar = document.getElementById('closeSidebar');
      const sidebarOverlay = document.getElementById('sidebarOverlay');

      settingsIcon.addEventListener('click', function() {
        settingsSidebar.classList.add('active');
        sidebarOverlay.style.display = 'block';
      });

      closeSidebar.addEventListener('click', function() {
        settingsSidebar.classList.remove('active');
        sidebarOverlay.style.display = 'none';
      });

      sidebarOverlay.addEventListener('click', function() {
        settingsSidebar.classList.remove('active');
        sidebarOverlay.style.display = 'none';
      });

      // Subscription button handler
      document.getElementById('subscriptionBtn').addEventListener('click', function(e) {
        e.preventDefault();
        alert('Subscription management will be implemented here');
      });
    });
  </script>
</body>
</html>