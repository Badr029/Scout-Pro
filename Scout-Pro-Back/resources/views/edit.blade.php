<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Edit Player Profile</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background-color: #f8f8f8;
      margin: 0;
      padding: 20px;
    }

    .edit-container {
      background-color: #fff;
      max-width: 800px;
      margin: 30px auto;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    h1 {
      color: #333;
      text-align: center;
      margin-bottom: 30px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: bold;
      color: #555;
    }

    input[type="text"],
    input[type="date"],
    input[type="number"],
    select,
    textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 16px;
    }

    textarea {
      min-height: 100px;
      resize: vertical;
    }

    .photo-upload {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 20px;
    }

    .profile-pic-preview {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background-color: #eee;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .profile-pic-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .upload-controls {
      flex-grow: 1;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 15px;
      margin-top: 30px;
    }

    .btn {
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      border: none;
      transition: background-color 0.3s;
    }

    .btn-primary {
      background-color: #333;
      color: white;
    }

    .btn-primary:hover {
      background-color: #555;
    }

    .btn-secondary {
      background-color: #eee;
      color: #333;
    }

    .btn-secondary:hover {
      background-color: #ddd;
    }

    .two-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    @media (max-width: 768px) {
      .two-columns {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="edit-container">
    <h1>Edit Your Profile</h1>
    @if ($errors->any())
            <ul class="error-list">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        @endif

    <form action="{{ url('edit') }}" method="POST" enctype="multipart/form-data">
      @csrf
      

      <div class="photo-upload">
        <div class="profile-pic-preview">
          @if($player && $player->profile_image)
            <img src="{{ asset('storage/' . $player->profile_image) }}" id="profileImagePreview" alt="Current Profile Image">
          @else
            <span id="profileImagePreviewText">No Image</span>
          @endif
        </div>
        <div class="upload-controls">
          <label for="profile_image">Profile Picture</label>
          <input type="file" id="profile_image" name="profile_image" accept="image/*">
          <small>Recommended size: 500x500 pixels</small>
        </div>
      </div>

      <div class="two-columns">
        <div class="form-group">
          <label for="first_name">First Name</label>
          <input type="text" id="first_name" name="first_name" value="{{ $user->first_name }}" required maxlength="255">
        </div>

        <div class="form-group">
          <label for="last_name">Last Name</label>
          <input type="text" id="last_name" name="last_name" value="{{ $user->last_name }}" required maxlength="255">
        </div>
      </div>

      <div class="two-columns">
        <div class="form-group">
          <label for="DateofBirth">Date of Birth</label>
          <input type="date" id="DateofBirth" name="DateofBirth" 
                 value="{{ $player->DateofBirth }}" 
                 required max="{{ date('Y-m-d', strtotime('-1 day')) }}">
        </div>

        <div class="form-group">
          <label for="phone_number">Phone Number</label>
          <input type="text" id="phone_number" name="phone_number" 
                 value="{{ $player->phone_number }}" required maxlength="15">
        </div>
      </div>

      <div class="two-columns">
        <div class="form-group">
          <label for="height">Height (cm)</label>
          <input type="number" id="height" name="height" 
                 value="{{ $player->height }}" min="100" max="250" required>
        </div>

        <div class="form-group">
          <label for="weight">Weight (kg)</label>
          <input type="number" id="weight" name="weight" 
                 value="{{ $player->weight }}" min="30" max="200" required>
        </div>
      </div>

      <div class="two-columns">
        <div class="form-group">
          <label for="position">Position</label>
          <select id="position" name="position" required>
            <option value="Goalkeeper" {{ $player->position == 'Goalkeeper' ? 'selected' : '' }}>Goalkeeper</option>
            <option value="center-back" {{ $player->position == 'center-back' ? 'selected' : '' }}>Center Back</option>
            <option value="full-back" {{ $player->position == 'full-back' ? 'selected' : '' }}>Full Back</option>
            <option value="wing-back" {{ $player->position == 'wing-back' ? 'selected' : '' }}>Wing Back</option>
            <option value="sweeper" {{ $player->position == 'sweeper' ? 'selected' : '' }}>Sweeper</option>
            <option value="central-midfield" {{ $player->position == 'central-midfield' ? 'selected' : '' }}>Central Midfield</option>
            <option value="defensive-midfield" {{ $player->position == 'defensive-midfield' ? 'selected' : '' }}>Defensive Midfield</option>
            <option value="attacking-midfield" {{ $player->position == 'attacking-midfield' ? 'selected' : '' }}>Attacking Midfield</option>
            <option value="wide-midfield" {{ $player->position == 'wide-midfield' ? 'selected' : '' }}>Wide Midfield</option>
            <option value="box-to-box-midfield" {{ $player->position == 'box-to-box-midfield' ? 'selected' : '' }}>Box-to-box Midfield</option>
            <option value="striker" {{ $player->position == 'striker' ? 'selected' : '' }}>Striker</option>
            <option value="centre-forward" {{ $player->position == 'centre-forward' ? 'selected' : '' }}>Centre Forward</option>
            <option value="winger" {{ $player->position == 'winger' ? 'selected' : '' }}>Winger</option>
            <option value="second-striker" {{ $player->position == 'second-striker' ? 'selected' : '' }}>Second Striker</option>
            <option value="false-nine" {{ $player->position == 'false-nine' ? 'selected' : '' }}>False Nine</option>
            <option value="wide-forward" {{ $player->position == 'wide-forward' ? 'selected' : '' }}>Wide Forward</option>
            
          </select>
        </div>

        <div class="form-group">
          <label for="preferred_foot">Preferred Foot</label>
          <select id="preferred_foot" name="preferred_foot" required>
            <option value="right" {{ $player->preferred_foot == 'right' ? 'selected' : '' }}>Right</option>
            <option value="left" {{ $player->preferred_foot == 'left' ? 'selected' : '' }}>Left</option>
            <option value="both" {{ $player->preferred_foot == 'both' ? 'selected' : '' }}>Both</option>
          </select>
        </div>
      </div>

      <div class="two-columns">
        <div class="form-group">
          <label for="gender">Gender</label>
          <select id="gender" name="gender" required>
            <option value="male" {{ $player->gender == 'male' ? 'selected' : '' }}>Male</option>
            <option value="female" {{ $player->gender == 'female' ? 'selected' : '' }}>Female</option>
          </select>
        </div>

        <div class="form-group">
          <label for="nationality">Nationality</label>
          <input type="text" id="nationality" name="nationality" 
                 value="{{ $player->nationality }}" required maxlength="255">
        </div>
      </div>

      <div class="two-columns">
        <div class="form-group">
          <label for="current_city">Current City</label>
          <input type="text" id="current_city" name="current_city" 
                 value="{{ $player->current_city }}" required maxlength="255">
        </div>

        <div class="form-group">
          <label for="current_club">Current Club</label>
          <input type="text" id="current_club" name="current_club" 
                 value="{{ $player->current_club }}" required maxlength="255">
        </div>
      </div>

      <div class="form-group">
        <label for="bio">Bio/Description</label>
        <textarea id="bio" name="bio" required maxlength="1000">{{ $player->bio }}</textarea>
      </div>

      <div class="form-actions">
      <a href="{{ url('/player/' . $player->id . '-' . $user->first_name) }}" class="btn btn-secondary">Cancel</a>

        <button type="submit" class="btn btn-primary">Save Changes</button>
      </div>
    </form>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Preview profile image before upload
      const profileImageInput = document.getElementById('profile_image');
      const profileImagePreview = document.getElementById('profileImagePreview');
      const profileImagePreviewText = document.getElementById('profileImagePreviewText');

      if (profileImageInput) {
        profileImageInput.addEventListener('change', function(e) {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
              if (profileImagePreview) {
                profileImagePreview.src = event.target.result;
                if (profileImagePreviewText) {
                  profileImagePreviewText.style.display = 'none';
                }
              } else {
                // Create image element if it doesn't exist
                const img = document.createElement('img');
                img.id = 'profileImagePreview';
                img.src = event.target.result;
                img.alt = 'Profile Preview';
                document.querySelector('.profile-pic-preview').prepend(img);
                if (profileImagePreviewText) {
                  profileImagePreviewText.style.display = 'none';
                }
              }
            };
            reader.readAsDataURL(file);
          }
        });
      }

      // Show/hide preferred foot based on position
      const positionSelect = document.getElementById('position');
      const preferredFootGroup = document.getElementById('preferred_foot').parentElement;

      function togglePreferredFoot() {
        if (positionSelect.value === 'Goalkeeper') {
          preferredFootGroup.style.display = 'none';
        } else {
          preferredFootGroup.style.display = 'block';
        }
      }

      // Initial check
      togglePreferredFoot();

      // Add event listener
      positionSelect.addEventListener('change', togglePreferredFoot);
    });
  </script>
</body>
</html>