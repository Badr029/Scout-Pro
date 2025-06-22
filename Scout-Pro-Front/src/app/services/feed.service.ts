import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FeedService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('No auth token found in localStorage');
      throw new Error('Authentication token not found. Please log in again.');
    }
    console.log('Using auth token for request:', token.substring(0, 20) + '...');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  submitReport(reportData: {
    type: string;
    item_id: number;
    reason: string;
    description: string;
    browser_info?: string;
  }): Observable<any> {
    // Map the report type to the correct endpoint
    let endpoint = '';
    let payload: any = {
      reason: reportData.reason,
      description: reportData.description
    };

    switch (reportData.type) {
      case 'video':
        endpoint = '/reports/video';
        payload.video_id = reportData.item_id;
        break;
      case 'user':
        endpoint = '/reports/user';
        payload.user_id = reportData.item_id;
        break;
      case 'bug':
        endpoint = '/reports/bug';
        payload.severity = 'medium'; // Default severity
        payload.page_url = window.location.href;
        payload.browser_info = reportData.browser_info || navigator.userAgent;
        break;
      default:
        throw new Error('Invalid report type');
    }

    return this.http.post(`${this.apiUrl}${endpoint}`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  getFeed(page: number = 1, filters: any = {}): Observable<any> {
    return this.http.get(`${this.apiUrl}/feed`, {
      headers: this.getAuthHeaders(),
      params: {
        page: page.toString(),
        ...filters
      }
    });
  }
} 