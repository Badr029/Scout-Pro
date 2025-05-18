<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Registration</title>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script> <!-- Include jQuery -->
    <script>
        $(document).ready(function() {
            $('#registerForm').on('submit', function(e) {
                e.preventDefault(); // Prevent the default form submission

                // Clear previous errors
                clearErrors();

                // Collect form data
                var formData = {
                    first_name: $('#first_name').val(),
                    last_name: $('#last_name').val(),
                    email: $('#email').val(),
                    user_type: $('#user_type').val(),
                    password: $('#password').val(),
                    password_confirmation: $('#password_confirmation').val(),
                };

                $.ajax({
                    url: '/api/register',  // API endpoint (adjust this if needed)
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') // Include CSRF token
                    },
                    data: formData,
                    success: function(response) {
                        if (response.token) {
                            // If registration is successful
                            alert('Registration successful!');

                            // Optionally store the token in localStorage for future API requests
                            localStorage.setItem('authToken', response.token);

                            // Redirect user or display success message
                            window.location.href = '/setup'; // or show success message in the UI
                        }
                    },
                    error: function(xhr) {
                        // Handle validation errors
                        if (xhr.status === 422) {
                            var errors = xhr.responseJSON.errors;
                            for (var field in errors) {
                                if (errors.hasOwnProperty(field)) {
                                    showError(field, errors[field][0]);
                                }
                            }
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

    <meta name="csrf-token" content="{{ csrf_token() }}"> <!-- CSRF Token -->
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

        input, select {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid var(--border);
            border-radius: 6px;
            font-size: 16px;
            transition: all 0.3s ease;
        }

        input:focus, select:focus {
            border-color: var(--primary);
            outline: none;
            box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
        }

        .row {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
        }

        .col {
            flex: 1;
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

        .success-message {
            color: var(--success);
            background-color: rgba(46, 204, 113, 0.1);
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 20px;
            display: none;
        }

        .error-list {
            background-color: rgba(231, 76, 60, 0.1);
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            list-style: none;
        }

        .error-list li {
            color: var(--error);
            padding: 5px 0;
        }

        .password-wrapper {
            position: relative;
        }

        .password-toggle {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            color: var(--primary);
            font-size: 14px;
        }

        @media (max-width: 576px) {
            .row {
                flex-direction: column;
                gap: 0;
            }

            .container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Create Your Account</h2>

        @if ($errors->any())
            <ul class="error-list">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        @endif

        <form id="registerForm">
            <div class="row">
                <div class="col form-group">
                    <label for="first_name">First Name</label>
                    <input type="text" id="first_name" name="first_name" value="{{ old('first_name') }}" required>
                    <div class="error" id="first_name_error"></div>
                </div>
                <div class="col form-group">
                    <label for="last_name">Last Name</label>
                    <input type="text" id="last_name" name="last_name" value="{{ old('last_name') }}" required>
                    <div class="error" id="last_name_error"></div>
                </div>
            </div>

            <div class="form-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" name="email" value="{{ old('email') }}" required>
                <div class="error" id="email_error"></div>
            </div>

            <div class="form-group">
                <label for="user_type">Account Type</label>
                <select id="user_type" name="user_type" required>
                    <option value="">Select Account Type</option>
                    <option value="scout" {{ old('user_type') == 'scout' ? 'selected' : '' }}>Scout</option>
                    <option value="player" {{ old('user_type') == 'player' ? 'selected' : '' }}>Player</option>
                </select>
                <div class="error" id="user_type_error"></div>
            </div>

            <div class="form-group password-wrapper">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required minlength="8">
                <span class="password-toggle" id="togglePassword">Show</span>
                <div class="error" id="password_error"></div>
            </div>

            <div class="form-group password-wrapper">
                <label for="password_confirmation">Confirm Password</label>
                <input type="password" id="password_confirmation" name="password_confirmation" required>
                <span class="password-toggle" id="toggleConfirmPassword">Show</span>
                <div class="error" id="password_confirmation_error"></div>
            </div>

            <h5>Already Have an Account? <a href="/login">Login </a></h5>
            <br>
            <button type="submit">Register Now</button>
        </form>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('userForm');
            const togglePassword = document.getElementById('togglePassword');
            const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

            // Password visibility toggle
            togglePassword.addEventListener('click', function() {
                const passwordInput = document.getElementById('password');
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                this.textContent = type === 'password' ? 'Show' : 'Hide';
            });

            toggleConfirmPassword.addEventListener('click', function() {
                const confirmInput = document.getElementById('password_confirmation');
                const type = confirmInput.getAttribute('type') === 'password' ? 'text' : 'password';
                confirmInput.setAttribute('type', type);
                this.textContent = type === 'password' ? 'Show' : 'Hide';
            });
        });
    </script>
</body>
</html>
