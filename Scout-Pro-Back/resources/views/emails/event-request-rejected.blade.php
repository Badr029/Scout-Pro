<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Event Request Rejected</title>
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
            background-color: #dc3545;
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
        .reason {
            background-color: #fff;
            padding: 15px;
            border-left: 4px solid #dc3545;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Event Request Rejected</h1>
    </div>

    <div class="content">
        <p>Dear {{ $data['organizer_name'] }},</p>

        <p>We regret to inform you that your event request has been rejected.</p>

        <h3>Event Details:</h3>
        <ul>
            <li><strong>Event Title:</strong> {{ $data['event_title'] }}</li>
        </ul>

        <div class="reason">
            <h4>Reason for Rejection:</h4>
            <p>{{ $data['rejection_reason'] }}</p>
        </div>

        <p>You are welcome to submit a new event request addressing the concerns mentioned above. If you have any questions, please don't hesitate to contact our support team.</p>
    </div>

    <div class="footer">
        <p>Thank you for using Scout Pro!</p>
        <p>© {{ date('Y') }} Scout Pro. All rights reserved.</p>
    </div>
</body>
</html>
