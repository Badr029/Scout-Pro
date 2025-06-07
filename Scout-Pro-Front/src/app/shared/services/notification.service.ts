import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Notification {
  id: number;
  type: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  notifications$ = this.notificationsSubject.asObservable();
  unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load initial notifications and start polling
    this.loadInitialData();
    this.startPolling();
  }

  private loadInitialData() {
    this.getNotifications().subscribe();
    this.getUnreadCount().subscribe();
  }

  private startPolling() {
    // Poll for new notifications every 30 seconds
    setInterval(() => {
      this.getNotifications().subscribe();
      this.getUnreadCount().subscribe();
    }, 30000);
  }

  getNotifications(): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    return this.http.get(this.apiUrl, { headers }).pipe(
      tap((response: any) => {
        if (response.data) {
          this.notificationsSubject.next(response.data);
        }
      })
    );
  }

  getUnreadCount(): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    return this.http.get(`${this.apiUrl}/unread-count`, { headers }).pipe(
      tap((response: any) => {
        if (response.count !== undefined) {
          this.unreadCountSubject.next(response.count);
        }
      })
    );
  }

  markAsRead(id: number): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    return this.http.post(`${this.apiUrl}/${id}/mark-as-read`, {}, { headers }).pipe(
      tap(() => {
        // Update local state
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(notification =>
          notification.id === id ? { ...notification, is_read: true } : notification
        );
        this.notificationsSubject.next(updatedNotifications);
        this.getUnreadCount().subscribe();
      })
    );
  }

  markAllAsRead(): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    return this.http.post(`${this.apiUrl}/mark-all-as-read`, {}, { headers }).pipe(
      tap(() => {
        // Update local state
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(notification =>
          ({ ...notification, is_read: true })
        );
        this.notificationsSubject.next(updatedNotifications);
        this.unreadCountSubject.next(0);
      })
    );
  }

  deleteNotification(id: number): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });

    return this.http.delete(`${this.apiUrl}/${id}`, { headers }).pipe(
      tap(() => {
        // Update local state
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.filter(notification =>
          notification.id !== id
        );
        this.notificationsSubject.next(updatedNotifications);
        this.getUnreadCount().subscribe();
      })
    );
  }

  // Helper method to create notifications for different events
  createNotification(userId: number, type: string, message: string, data: any = null): Observable<any> {
    return this.http.post(this.apiUrl, {
      user_id: userId,
      type,
      message,
      data
    });
  }
}
