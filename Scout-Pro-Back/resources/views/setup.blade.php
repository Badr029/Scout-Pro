<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Player Setup</title>
    <!-- Include Select2 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/select2@4.0.13/dist/css/select2.min.css" rel="stylesheet" />
    <!-- Include jQuery (needed for Select2) -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <!-- Include Select2 JS -->
    <script src="https://cdn.jsdelivr.net/npm/select2@4.0.13/dist/js/select2.min.js"></script>
    <script>
        $(document).ready(function() {
            $('#userForm').on('submit', function(e) {
                e.preventDefault(); // Prevent the default form submission

                // Clear previous errors
                clearErrors();

                // Collect form data
                var formData = {
                    DateofBirth: $('#DateofBirth').val(),
                    phone_number: $('#phone_number').val(),
                    height: $('#height').val(),
                    weight: $('#weight').val(),
                    preferred_foot: $('#preferred_foot').val(),
                    position: $('#position').val(),
                    nationality: $('#nationality').val(),
                    current_city: $('#current_city').val(),
                    current_club: $('#current_club').val(),
                    bio: $('#bio').val(),
                };

                $.ajax({
    url: '/api/player/setup',  // The endpoint where you handle setup
    method: 'POST',
    data: formData,  // Form data being sent
    success: function(response) {
        // Alert success message
        alert(response.message);

        // Redirect to the player profile page
        window.location.href = response.profile_url;  // This is the URL returned from the backend
    },
    error: function(xhr) {
        if (xhr.status === 422) {
            var errors = xhr.responseJSON.errors;
            for (var field in errors) {
                if (errors.hasOwnProperty(field)) {
                    showError(field, errors[field][0]);
                }
            }
        } else if (xhr.status === 401) {
            alert('You must be logged in to submit your profile.');
            window.location.href = '/login';  // Redirect to login page
        } else {
            alert('An error occurred, please try again.');
        }
    }
});

            });

            // Function to display errors
            function showError(fieldId, message) {
                var errorElement = $('#' + fieldId + '_error');
                var field = $('#' + fieldId);

                field.addClass('input-error');
                errorElement.text(message).show();
            }

            // Function to clear errors
            function clearErrors() {
                $('.error').hide().text('');
                $('input, select').removeClass('input-error');
            }
        });
    </script>
    <style>
        :root {
            --primary: #3498db;
            --primary-hover: #2980b9;
            --error: #e74c3c;
            --success: #2ecc71;
            --border: #ddd;
            --text: #333;
            --light-bg: #f5f5f5;
            --white: #fff;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            background-color: var(--light-bg);
            color: var(--text);
            padding: 20px;
        }

        .container {
            max-width: 600px;
            margin: 30px auto;
            background: var(--white);
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }

        h2 {
            text-align: center;
            margin-bottom: 25px;
            color: var(--primary);
            font-size: 28px;
        }

        .form-group {
            margin-bottom: 20px;
            position: relative;
        }

        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: var(--text);
        }

        input, select, textarea {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid var(--border);
            border-radius: 6px;
            font-size: 16px;
            transition: all 0.3s ease;
        }

        input:focus, select:focus, textarea:focus {
            border-color: var(--primary);
            outline: none;
            box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
        }

        button {
            background-color: var(--primary);
            color: var(--white);
            border: none;
            padding: 14px 20px;
            font-size: 16px;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            width: 100%;
            transition: background-color 0.3s;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        button:hover {
            background-color: var(--primary-hover);
        }

        .error {
            color: var(--error);
            font-size: 13px;
            margin-top: 5px;
            display: none;
        }

        .input-error {
            border-color: var(--error) !important;
        }

        @media (max-width: 576px) {
            .container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>

    <div class="container">
        <h2>Player Setup</h2>
        @if ($errors->any())
            <ul class="error-list">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        @endif
        <form id="userForm">
            @csrf

            <div class="form-group">
                <label for="DateofBirth">Date of Birth</label>
                <input type="date" id="DateofBirth" name="DateofBirth" required>
                <div class="error" id="DateofBirth_error"></div>
            </div>

            <div class="form-group">
                <label for="phone_number">Phone Number</label>
                <input type="text" id="phone_number" name="phone_number" required>
                <div class="error" id="phone_number_error"></div>
            </div>

            <div class="form-group">
                <label for="height">Height (in cm)</label>
                <input type="number" step="0.01" id="height" name="height" required>
                <div class="error" id="height_error"></div>
            </div>

            <div class="form-group">
                <label for="weight">Weight (in kg)</label>
                <input type="number" step="0.01" id="weight" name="weight" required>
                <div class="error" id="weight_error"></div>
            </div>

            <div class="form-group">
                <label for="preferred_foot">Preferred Foot</label>
                <select name="preferred_foot" id="preferred_foot" required>
                    <option value="Left" {{ old('preferred_foot') == 'Left' ? 'selected' : '' }}>Left</option>
                    <option value="Right" {{ old('preferred_foot') == 'Right' ? 'selected' : '' }}>Right</option>
                    <option value="both" {{ old('preferred_foot') == 'both' ? 'selected' : '' }}>Both</option>
                </select>
                <div class="error" id="preferred_foot_error"></div>
            </div>

            <div class="form-group">
                <label for="position">Position</label>
                <select id="position" name="position" required>
                    <option value="">Select Position</option>
                    <option value="Goalkeeper">Goalkeeper</option>
                    <option value="center-back">Center-Back</option>
                    <option value="full-back">Full-Back</option>
                    <option value="wing-back">Wing-Back</option>
                    <option value="sweeper">Sweeper</option>
                    <option value="central-midfield">Central Midfield</option>
                    <option value="defensive-midfield">Defensive Midfield</option>
                    <option value="attacking-midfield">Attacking Midfield</option>
                    <option value="wide-midfield">Wide Midfield</option>
                    <option value="box-to-box-midfield">Box-to-Box Midfield</option>
                    <option value="striker">Striker</option>
                    <option value="centre-forward">Centre-Forward</option>
                    <option value="winger">Winger</option>
                    <option value="second-striker">Second Striker</option>
                    <option value="false-nine">False Nine</option>
                    <option value="wide-forward">Wide Forward</option>
                </select>
                <div class="error" id="position_error"></div>
            </div>

            <div class="form-group">
                <label for="gender">Gender</label>
                <select id="gender" name="gender" required>
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
                <div class="error" id="gender_error"></div>
            </div>

            <!-- Nationality Dropdown -->
            <div class="form-group">
                <label for="nationality">Nationality</label>
                <select id="nationality" name="nationality" class="select2" required>
                    <option value="">Select your country</option>
                    <!-- Dynamically populated countries will go here -->
                </select>
                <div class="error" id="nationality_error"></div>
            </div>

            <!-- Current City Dropdown (Only Egypt Cities) -->
            <div class="form-group">
                <label for="current_city">Current City</label>
                <select id="current_city" name="current_city" class="select2" required>
                    <option value="">Select your city</option>
                    <!-- Cities will be populated by script -->
                </select>
                <div class="error" id="current_city_error"></div>
            </div>

            <div class="form-group">
                <label for="current_club">Current Club</label>
                <input type="text" id="current_club" name="current_club" required>
                <div class="error" id="current_club_error"></div>
            </div>

            <div class="form-group">
                <label for="bio">Bio</label>
                <textarea id="bio" name="bio" rows="4"></textarea>
                <div class="error" id="bio_error"></div>
            </div>

            <button type="submit">Save</button>
        </form>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Fetch countries from Restcountries API
            fetch('https://restcountries.com/v3.1/all')
                .then(response => response.json())
                .then(data => {
                    const nationalitySelect = document.getElementById('nationality');
                    data.forEach(country => {
                        const option = document.createElement('option');
                        option.value = country.name.common;
                        option.textContent = country.name.common;
                        nationalitySelect.appendChild(option);
                    });

                    // Initialize Select2 for the Nationality dropdown
                    $('#nationality').select2({
                        placeholder: 'Search for a country',
                        allowClear: true
                    });
                })
                .catch(error => console.error('Error fetching countries:', error));

            // Fetch cities for Egypt from the Geonames API
            fetch('http://api.geonames.org/searchJSON?country=EG&maxRows=1000&username=your_geonames_username')
                .then(response => response.json())
                .then(data => {
                    const citiesSelect = document.getElementById('current_city');
                    data.geonames.forEach(city => {
                        const option = document.createElement('option');
                        option.value = city.name;
                        option.textContent = city.name;
                        citiesSelect.appendChild(option);
                    });

                    // Initialize Select2 for the City dropdown
                    $('#current_city').select2({
                        placeholder: 'Search for a city',
                        allowClear: true
                    });
                })
                .catch(error => console.error('Error fetching cities:', error));
        });
    </script>

</body>
</html>
