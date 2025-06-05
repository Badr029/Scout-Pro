<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Event Request Approved</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #1DB954;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 5px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Event Request Approved</h1>
    </div>

    <div class="content">
        <p>Dear {{ $data['organizer_name'] }},</p>

        <p>We're pleased to inform you that your event request has been approved!</p>

        <h3>Event Details:</h3>
        <ul>
            <li><strong>Event Title:</strong> {{ $data['event_title'] }}</li>
            <li><strong>Date:</strong> {{ $data['event_date'] }}</li>
            <li><strong>Location:</strong> {{ $data['event_location'] }}</li>
        </ul>

        <p>Your event is now visible on the Scout Pro platform. Players and scouts can view and interact with your event.</p>

        <p>If you need to make any changes to your event details, please contact our support team.</p>
    </div>

    <div class="footer">
        <p>Thank you for using Scout Pro!</p>
        <p>© {{ date('Y') }} Scout Pro. All rights reserved.</p>
    </div>
</body>
</html>
