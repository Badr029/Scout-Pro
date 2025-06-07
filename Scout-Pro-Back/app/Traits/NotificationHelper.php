<?php

namespace App\Traits;

use App\Models\Notification;
use App\Models\User;

trait NotificationHelper
{
    public function createFollowNotification(User $follower, User $following)
    {
        return Notification::create([
            'user_id' => $following->id,
            'actor_id' => $follower->id,
            'type' => 'follow',
            'message' => "{$follower->first_name} {$follower->last_name} started following you",
            'data' => [
                'follower_id' => $follower->id,
                'follower_name' => $follower->first_name . ' ' . $follower->last_name
            ]
        ]);
    }

    public function createContactRequestNotification(User $scout, User $player)
    {
        // Only create notification if the player has a premium membership
        if ($player->player && $player->player->membership === 'premium') {
            return Notification::create([
                'user_id' => $player->id,
                'actor_id' => $scout->id,
                'type' => 'contact_request',
                'message' => "A scout from {$scout->scout->organization} has requested your contact information",
                'data' => [
                    'scout_id' => $scout->id,
                    'scout_name' => $scout->first_name . ' ' . $scout->last_name,
                    'organization' => $scout->scout->organization
                ]
            ]);
        }
        return null;
    }

    public function createLikeNotification(User $liker, User $contentOwner, string $contentType)
    {
        // Only create notification if the content owner is a premium player
        if ($contentOwner->player && $contentOwner->player->membership === 'premium') {
            return Notification::create([
                'user_id' => $contentOwner->id,
                'actor_id' => $liker->id,
                'type' => 'like',
                'message' => "{$liker->first_name} {$liker->last_name} liked your {$contentType}",
                'data' => [
                    'liker_id' => $liker->id,
                    'liker_name' => $liker->first_name . ' ' . $liker->last_name,
                    'content_type' => $contentType
                ]
            ]);
        }
        return null;
    }

    public function createCommentNotification(User $commenter, User $contentOwner)
    {
        // Only create notification if the content owner is a premium player
        if ($contentOwner->player && $contentOwner->player->membership === 'premium') {
            return Notification::create([
                'user_id' => $contentOwner->id,
                'actor_id' => $commenter->id,
                'type' => 'comment',
                'message' => "{$commenter->first_name} {$commenter->last_name} commented on your post",
                'data' => [
                    'commenter_id' => $commenter->id,
                    'commenter_name' => $commenter->first_name . ' ' . $commenter->last_name
                ]
            ]);
        }
        return null;
    }

    public function createEventNotification(User $user, array $eventData)
    {
        return Notification::create([
            'user_id' => $user->id,
            'type' => 'event',
            'message' => "New event: {$eventData['title']}",
            'data' => $eventData
        ]);
    }

    public function createSubscriptionNotification(User $user, string $message, array $subscriptionData = [])
    {
        return Notification::create([
            'user_id' => $user->id,
            'type' => 'subscription',
            'message' => $message,
            'data' => $subscriptionData
        ]);
    }

    public function createContactRequestStatusNotification(User $scout, string $status)
    {
        $message = $status === 'approved'
            ? "Your contact request has been approved! Please check your email for the player's contact details."
            : ($status === 'rejected'
                ? "Your contact request has been rejected. Please check your email for more information."
                : "Your contact request is pending review. We will notify you once it has been processed.");

        return Notification::create([
            'user_id' => $scout->id,
            'type' => 'contact_request_status',
            'message' => $message,
            'data' => [
                'status' => $status,
                'updated_at' => now()->toDateTimeString()
            ]
        ]);
    }

    public function createEventRequestStatusNotification(User $scout, string $status, string $eventTitle)
    {
        return Notification::create([
            'user_id' => $scout->id,
            'type' => 'event_status',
            'message' => "Your event request '{$eventTitle}' has been {$status}. Please check your email for details.",
            'data' => [
                'status' => $status,
                'event_title' => $eventTitle
            ]
        ]);
    }

    public function createNewEventNotification(User $user, array $eventData, bool $isAdminCreated = false)
    {
        $message = $isAdminCreated
            ? "New official event: {$eventData['title']}"
            : "New event: {$eventData['title']}";

        return Notification::create([
            'user_id' => $user->id,
            'type' => 'new_event',
            'message' => $message,
            'data' => array_merge($eventData, ['is_admin_created' => $isAdminCreated])
        ]);
    }

    public function notifyUsersAboutEvent(array $eventData, bool $isAdminCreated = false)
    {
        // If admin created, notify all scouts and premium players
        if ($isAdminCreated) {
            // Notify all scouts
            $scouts = User::whereHas('scout')->get();
            foreach ($scouts as $scout) {
                $this->createNewEventNotification($scout, $eventData, true);
            }

            // Notify all premium players
            $premiumPlayers = User::whereHas('player', function($query) {
                $query->where('membership', 'premium');
            })->get();
            foreach ($premiumPlayers as $player) {
                $this->createNewEventNotification($player, $eventData, true);
            }
        } else {
            // If scout created and approved, only notify premium players
            $premiumPlayers = User::whereHas('player', function($query) {
                $query->where('membership', 'premium');
            })->get();
            foreach ($premiumPlayers as $player) {
                $this->createNewEventNotification($player, $eventData, false);
            }
        }
    }

    public function createSubscriptionDeactivationNotification(User $user)
    {
        return Notification::create([
            'user_id' => $user->id,
            'type' => 'subscription_deactivated',
            'message' => "Your subscription plan has been deactivated. Please contact support for assistance.",
            'data' => [
                'deactivated_at' => now()->toDateTimeString()
            ]
        ]);
    }
}
