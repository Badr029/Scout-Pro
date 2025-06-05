@component('mail::message')
# Contact Request Update

Dear {{ $scout_name }},

We regret to inform you that your contact request for player **{{ $player_name }}** has been rejected by our administrative team.

@if($message)
**Your Original Message:**
{{ $message }}
@endif

This decision was made in accordance with our platform's guidelines and policies. You may submit a new request after reviewing our contact request guidelines.

If you believe this was done in error or have any questions, please don't hesitate to contact our support team.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
