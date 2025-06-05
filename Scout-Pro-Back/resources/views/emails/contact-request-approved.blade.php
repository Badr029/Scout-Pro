@component('mail::message')
# Contact Request Approved

Dear {{ $scout_name }},

Your contact request for player **{{ $player_name }}** has been approved. You can now contact the player directly using the following information:

**Player Contact Details:**
- Email: {{ $player_email }}
- Phone: {{ $player_phone }}

@if($message)
**Your Message:**
{{ $message }}
@endif

Please be professional and respectful in your communication.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
