import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import Pusher from 'pusher-js';
import { environment } from '../../environments/environment';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  link?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private pusher: Pusher;
  private channel: any;
  private notifications = new BehaviorSubject<Notification[]>([]);

  constructor() {
    // Initialize with some dummy notifications for testing
    this.notifications.next([
      {
        id: '1',
        title: 'Welcome to Scout Pro',
        message: 'Thank you for joining Scout Pro! Start exploring talents now.',
        type: 'info',
        timestamp: new Date(),
        read: false
      }
    ]);
  }

  initializePusher(userId: string) {
    // Initialize Pusher with your credentials
    this.pusher = new Pusher('YOUR_PUSHER_KEY', {
      cluster: 'YOUR_CLUSTER',
      encrypted: true
    });

    // Subscribe to user's private channel
    this.channel = this.pusher.subscribe(`private-user-${userId}`);

    // Listen for notifications
    this.channel.bind('new-notification', (data: any) => {
      this.addNotification(data);
    });
  }

  getNotifications(): Observable<Notification[]> {
    return this.notifications.asObservable();
  }

  addNotification(notification: Notification) {
    const currentNotifications = this.notifications.value;
    this.notifications.next([notification, ...currentNotifications]);
  }

  markAsRead(notificationId: string) {
    const currentNotifications = this.notifications.value;
    const updatedNotifications = currentNotifications.map(notification => {
      if (notification.id === notificationId) {
        return { ...notification, read: true };
      }
      return notification;
    });
    this.notifications.next(updatedNotifications);
  }

  markAllAsRead() {
    const currentNotifications = this.notifications.value;
    const updatedNotifications = currentNotifications.map(notification => ({
      ...notification,
      read: true
    }));
    this.notifications.next(updatedNotifications);
  }

  removeNotification(notificationId: string) {
    const currentNotifications = this.notifications.value;
    const updatedNotifications = currentNotifications.filter(
      notification => notification.id !== notificationId
    );
    this.notifications.next(updatedNotifications);
  }

  clearAll() {
    this.notifications.next([]);
  }

  disconnect() {
    if (this.channel) {
      this.channel.unbind_all();
      this.pusher.unsubscribe(`private-user-${this.channel}`);
    }
  }
}
