<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EventController extends Controller
{
    /**
     * Display a listing of events.
     */
    public function index(Request $request)
    {
        $events = Event::query()
            ->when($request->has('location'), function ($query) use ($request) {
                return $query->where('location', 'like', '%' . $request->location . '%');
            })
            ->when($request->has('date'), function ($query) use ($request) {
                return $query->whereDate('date', $request->date);
            })
            ->orderBy('date', 'asc')
            ->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $events
        ]);
    }

    /**
     * Display the specified event.
     */
    public function show(Event $event)
    {
        return response()->json([
            'status' => 'success',
            'data' => $event
        ]);
    }
}
