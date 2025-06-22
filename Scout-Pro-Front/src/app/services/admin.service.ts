import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('No auth token found in localStorage');
      throw new Error('Authentication token not found. Please log in again.');
    }
    console.log('Using auth token for admin request:', token.substring(0, 20) + '...');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  updateReportStatus(id: number, data: { status: string; admin_notes?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/reports/${id}`, data, {
      headers: this.getAuthHeaders()
    });
  }

  getReports(page: number = 1, filters: any = {}): Observable<any> {
    console.log('AdminService.getReports called', { page, filters });
    const params = {
      page: page.toString(),
      ...filters
    };
    console.log('Making request to:', `${this.apiUrl}/reports`, 'with params:', params);
    return this.http.get(`${this.apiUrl}/reports`, { 
      headers: this.getAuthHeaders(),
      params 
    }).pipe(
      tap(response => console.log('AdminService.getReports response:', response)),
      catchError(error => {
        console.error('AdminService.getReports error:', error);
        throw error;
      })
    );
  }

  getReportDetails(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/reports/${id}`, {
      headers: this.getAuthHeaders()
    });
  }
} 