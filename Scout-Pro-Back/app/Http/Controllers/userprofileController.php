<?php

// namespace App\Http\Controllers;


// use App\Models\Player;
// use App\Models\Outfield;
// use App\Models\Goalkeeper;
// use App\Models\User;
// use App\Models\Post;
// use Illuminate\Support\Facades\Auth;
// use Illuminate\Http\Request;
// use Illuminate\Support\Facades\Storage;







// class UserprofileController extends Controller
// {
//     public function calculateAge($DateofBirth)
//     {
//         if (!$DateofBirth) return null;
//         $birthDate = new \DateTime($DateofBirth);
//         $currentDate = new \DateTime();
//         $age = $birthDate->diff($currentDate)->y;
//         return $age;
//     }



//     public function profile($id, $first_name)

//     {   $user = Auth::user();
//         $player = Player::where('user_id', $user->id)->first();

//         if ($player) {
//             if ($player->user->first_name !== $first_name) {
//                 return redirect('/player/' . $player->id . '-' . $player->user->first_name); }

//             $goalkeeper = $player->Goalkeeper;
//             $outfield = $player->outfield;
//             $age = null;

//             if ($player->DateofBirth) {
//                 $age = $this->calculateAge($player->DateofBirth);
//             }

//             return view('userprofile', compact('user', 'player', 'age', 'outfield', 'goalkeeper'));
//         } else {
//             return redirect('login');
//         }
//     }


//         public function logoutRequest(Request $request)
//         {
//             Auth::logout();
//             $request->session()->invalidate();
//             $request->session()->regenerateToken();
//             return redirect('login');
//         }



//         public function storeVideo(Request $request)
//     {
//         $request->validate([
//             'title' => 'required|max:100',
//             'description' => 'nullable',
//             'video' => 'required|file|mimes:mp4,mov,avi|max:50000'
//         ]);

//         $player = Auth::user()->player;

//         // Store video
//         $videoPath = $request->file('video')->store('videos', 'public');
//         $publicPath = Storage::url($videoPath); // Generates path like /storage/videos/file.mp4

//         // Create post
//         Post::create([
//             'player_id' => $player->id,
//             'title' => $request->title,
//             'description' => $request->description,
//             'video_url' => $publicPath
//         ]);

//         return back()->with('success', 'Video posted successfully!');}

//         public function deleteVideo(Post $post)
//     {
//         // Check if the authenticated user owns this post
//         if (Auth::user()->player->id !== $post->player_id) {
//             abort(403, 'Unauthorized action.');
//         }

//         // Delete the video file
//         Storage::delete(str_replace('/storage', 'public', $post->video_url));

//         // Delete the post
//         $post->delete();

//         return back()->with('success', 'Video deleted successfully!');
//     }

//     public function edit(){
//         $user = Auth::user();
//         $player = $user->player;
//         return view('edit',compact('user','player'));
//     }
//     public function update(Request $request)
// {
//     $user = Auth::user();
//     $player = $user->player;

//     $validated = $request->validate([
//         'first_name' => 'required|string|max:255',
//         'last_name' => 'required|string|max:255',
//         'DateofBirth' => 'required|date|before:today',
//         'phone_number' => 'required|string|max:15',
//         'height' => 'required|integer|min:100|max:250',
//         'weight' => 'required|integer|min:30|max:200',
//         'position' => 'required|in:Goalkeeper,center-back,full-back,wing-back,sweeper,central-midfield,defensive-midfield,attacking-midfield,wide-midfield,box-to-box-midfield,striker,centre-forward,winger,second-striker,false-nine,wide-forward',
//         'preferred_foot' => 'required|string|max:255',
//         'nationality' => 'required|string|max:255',
//         'current_city' => 'required|string|max:255',
//         'current_club' => 'required|string|max:255',
//         'bio' => 'required|string|max:1000',
//     ]);

//     $user->update([
//         'first_name' => $validated['first_name'],
//         'last_name' => $validated['last_name']
//     ]);

//     $player->update([
//         'DateofBirth'=> $validated['DateofBirth'],
//         'phone_number'=> $validated['phone_number'],
//         'height'=> $validated['height'],
//         'weight'=> $validated['weight'],
//         'position'=> $validated['position'],
//         'preferred_foot'=> $validated['preferred_foot'],
//         'nationality'=> $validated['nationality'],
//         'current_city'=> $validated['current_city'],
//         'current_club'=> $validated['current_club'],
//         'bio'=> $validated['bio'],
//     ]);

//     return redirect('/player/' . $player->id . '-' . $user->first_name)->with('success', 'Profile updated successfully!');
// }

// }


