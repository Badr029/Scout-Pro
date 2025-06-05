<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Subscription Invoice</title>
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
            background-color: #4f7df9;
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
        .invoice-details {
            background-color: #fff;
            padding: 15px;
            border-left: 4px solid #4f7df9;
            margin: 20px 0;
        }
        .payment-details {
            background-color: #fff;
            padding: 15px;
            border-left: 4px solid #22c55e;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 0.9em;
        }
        .amount {
            font-size: 24px;
            color: #22c55e;
            font-weight: bold;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f5f5f5;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Subscription Invoice</h1>
    </div>

    <div class="content">
        <p>Dear {{ $scout_name }},</p>

        <p>Thank you for subscribing to Scout Pro! Here's your invoice for the subscription purchase:</p>

        <div class="invoice-details">
            <h3>Invoice Details</h3>
            <table>
                <tr>
                    <th>Invoice Number:</th>
                    <td>#{{ $invoice_number }}</td>
                </tr>
                <tr>
                    <th>Date:</th>
                    <td>{{ $invoice_date }}</td>
                </tr>
                <tr>
                    <th>Plan:</th>
                    <td>{{ $plan_name }}</td>
                </tr>
                <tr>
                    <th>Amount:</th>
                    <td class="amount">EGP {{ number_format($amount, 2) }}</td>
                </tr>
            </table>
        </div>

        <div class="payment-details">
            <h3>Payment Details</h3>
            <table>
                <tr>
                    <th>Payment Method:</th>
                    <td>Credit Card ending in {{ $card_last_four }}</td>
                </tr>
                <tr>
                    <th>Status:</th>
                    <td style="color: #22c55e;">Paid</td>
                </tr>
                <tr>
                    <th>Subscription Valid Until:</th>
                    <td>{{ $expiry_date }}</td>
                </tr>
            </table>
        </div>

        <p>Your subscription is now active and you have full access to all premium features. The next payment will be automatically processed on {{ $expiry_date }}.</p>

        <p>If you have any questions about your subscription or need assistance, please don't hesitate to contact our support team.</p>
    </div>

    <div class="footer">
        <p>Thank you for choosing Scout Pro!</p>
        <p>© {{ date('Y') }} Scout Pro. All rights reserved.</p>
    </div>
</body>
</html>
