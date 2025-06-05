<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class EventController extends Controller
{
    /**
     * Display a listing of events.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $events = Event::query()
            ->when($request->has('location'), function ($query) use ($request) {
                return $query->where('location', 'like', '%' . $request->location . '%');
            })
            ->when($request->has('date'), function ($query) use ($request) {
                return $query->whereDate('date', $request->date);
            })
            ->where(function ($query) use ($user) {
                // Show approved events to everyone
                $query->where('status', 'approved');

                // Show pending events only to their organizers
                if ($user) {
                    $query->orWhere(function($q) use ($user) {
                        $q->where('status', 'pending')
                          ->where('organizer_id', $user->id);
                    });
                }
            })
            ->with(['organizer' => function($query) {
                $query->select('id', 'first_name', 'last_name', 'email');
            }])
            ->orderBy('date', 'asc')
            ->get()
            ->map(function($event) use ($user) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'description' => $event->description,
                    'date' => $event->date,
                    'location' => $event->location,
                    'image' => $event->image ? url('storage/' . $event->image) : null,
                    'status' => $event->status,
                    'organizer' => [
                        'id' => $event->organizer->id,
                        'name' => $event->organizer->first_name . ' ' . $event->organizer->last_name,
                        'email' => $event->organizer->email
                    ],
                    'is_organizer' => $event->organizer_id === $user->id,
                    'target_audience' => $event->target_audience
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $events
        ]);
    }

    /**
     * Store a newly created event in storage.
     */
    public function store(Request $request)
    {
        // Validate the request
        $validated = $request->validate([
            'title' => 'required|string|min:5',
            'description' => 'nullable|string',
            'date' => 'required|date',
            'time' => 'required|date_format:H:i',
            'location' => 'required|string',
            'image' => 'nullable|image|max:2048', // 2MB max
            'organizer_contact' => 'required|email',
            'target_audience' => 'required|in:players,scouts,public',
        ]);

        // Combine date and time
        $dateTime = $validated['date'] . ' ' . $validated['time'];

        // Handle image upload if present
        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('event-images', 'public');
        }

        // Create the event
        $event = Event::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'date' => $dateTime,
            'location' => $validated['location'],
            'image' => $imagePath,
            'organizer_id' => Auth::id(),
            'organizer_contact' => $validated['organizer_contact'],
            'target_audience' => $validated['target_audience'],
            'status' => 'pending',
            'responded_at' => null
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Event request submitted successfully and awaiting approval',
            'data' => $event
        ], 201);
    }

    /**
     * Display the specified event.
     */
    public function show(Event $event)
    {
        // Check if user can view this event
        if (Auth::user()->role !== 'admin' &&
            $event->status !== 'approved' &&
            $event->organizer_id !== Auth::id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized to view this event'
            ], 403);
        }

        return response()->json([
            'status' => 'success',
            'data' => $event->load('organizer')
        ]);
    }

    /**
     * Update the event status (Admin only).
     */
    public function updateStatus(Request $request, Event $event)
    {
        // Verify if user is admin
        if (Auth::user()->role !== 'admin') {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 403);
        }

        // Validate the request
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'rejection_reason' => 'required_if:status,rejected|nullable|string'
        ]);

        // Update the event
        $event->update([
            'status' => $validated['status'],
            'rejection_reason' => $validated['rejection_reason'] ?? null,
            'responded_at' => now()
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Event status updated successfully',
            'data' => $event
        ]);
    }
}
