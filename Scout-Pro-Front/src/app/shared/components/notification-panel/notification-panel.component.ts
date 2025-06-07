import { Component, OnInit, Input, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-panel',
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.scss'],
  standalone: true,
  imports: [CommonModule, TimeAgoPipe]
})
export class NotificationPanelComponent implements OnInit, OnDestroy {
  @Input() sidebarExpanded: boolean = false;
  @Output() panelToggled = new EventEmitter<boolean>();
  notifications: Notification[] = [];
  unreadCount: number = 0;
  isOpen: boolean = false;

  private notificationsSubscription?: Subscription;
  private unreadCountSubscription?: Subscription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    // Subscribe to notifications
    this.notificationsSubscription = this.notificationService.notifications$
      .subscribe(notifications => {
        this.notifications = notifications;
      });

    // Subscribe to unread count
    this.unreadCountSubscription = this.notificationService.unreadCount$
      .subscribe(count => {
        this.unreadCount = count;
      });
  }

  ngOnDestroy() {
    // Clean up subscriptions
    if (this.notificationsSubscription) {
      this.notificationsSubscription.unsubscribe();
    }
    if (this.unreadCountSubscription) {
      this.unreadCountSubscription.unsubscribe();
    }
  }

  togglePanel() {
    this.isOpen = !this.isOpen;
    this.panelToggled.emit(this.isOpen);
  }

  markAsRead(notificationId: number) {
    this.notificationService.markAsRead(notificationId).subscribe();
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe();
  }

  deleteNotification(notificationId: number) {
    this.notificationService.deleteNotification(notificationId).subscribe();
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'follow':
        return 'fas fa-user-plus';
      case 'contact_request':
        return 'fas fa-address-card';
      case 'like':
        return 'fas fa-heart';
      case 'comment':
        return 'fas fa-comment';
      case 'event':
        return 'fas fa-calendar-alt';
      case 'subscription':
        return 'fas fa-star';
      default:
        return 'fas fa-bell';
    }
  }
}
