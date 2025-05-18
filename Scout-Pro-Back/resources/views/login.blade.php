<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Form</title>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script>
        $(document).ready(function() {
            $('#userForm').on('submit', function(e) {
                e.preventDefault(); // Prevent the default form submission

                // Clear previous errors
                clearErrors();

                // Collect form data
                var formData = {
                    email: $('#email').val(),
                    password: $('#password').val(),
                };

                $.ajax({
                    url: '/api/login',  // Adjust API endpoint as needed
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') // CSRF token for Laravel
                    },
                    data: formData,
                    success: function(response) {
                        if (response.token) {
                            // If login is successful
                            alert('Login successful!');
                            localStorage.setItem('authToken', response.token);  // Store the token
                            window.location.href = '/dashboard';  // Redirect to the dashboard or other page
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
                $('input').removeClass('input-error');
            }
        });
    </script>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        body {
            background-color: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }

        .login-form {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            padding: 30px;
            width: 100%;
            max-width: 450px;
        }

        .form-title {
            text-align: center;
            margin-bottom: 25px;
            color: #2c3e50;
            font-size: 24px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #34495e;
            font-weight: 500;
        }

        .form-group input {
            width: 100%;
            padding: 12px 15px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 16px;
            transition: border-color 0.3s;
        }

        .form-group input:focus {
            border-color: #3498db;
            outline: none;
        }

        .submit-btn {
            width: 100%;
            padding: 12px;
            background-color: #3498db;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.3s;
        }

        .submit-btn:hover {
            background-color: #2980b9;
        }

        .error-message {
            color: red;
            font-size: 14px;
            margin-bottom: 10px;
        }

        .error {
            color: #e74c3c;
            font-size: 13px;
            margin-top: 5px;
            display: none;
        }

        .input-error {
            border-color: #e74c3c !important;
        }

        .form-check {
            margin-top: 15px;
            text-align: left;
        }

        .form-check input {
            margin-right: 5px;
        }

        .form-check-label {
            font-size: 14px;
        }
    </style>
</head>
<body>

@if ($errors->any())
    <div style="color:red; margin-bottom:10px;">
        @foreach ($errors->all() as $error)
            <p>{{ $error }}</p>
        @endforeach
    </div>
@endif

    <form class="login-form" id="userForm">
        @csrf
        <h1 class="form-title">Login</h1>

        <div class="form-group">
            <label for="email">Email Address</label>
            <input type="email" id="email" name="email" placeholder="Enter your email" value="{{ old('email') }}" required>
            <div class="error" id="email_error"></div>
        </div>

        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Enter your password" required>
            <div class="error" id="password_error"></div>
        </div>

        <div class="form-check">
            <input type="checkbox" name="remember" id="remember" class="form-check-input">
            <label for="remember" class="form-check-label">Remember Me</label>
        </div>

        <div class="form-check">
            <a href="/register">or Register Now!</a>
        </div>

        <button type="submit" class="submit-btn">Login</button>
    </form>

</body>
</html>
