import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'https://your-api-url.com'; // Replace with your API base URL

  constructor(private http: HttpClient) { }

  getData(endpoint: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${endpoint}`);
  }

  postData(endpoint: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${endpoint}`, data);
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  loginWithGoogle(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login/google/callback`, data);
  }

  // Add more methods as needed for PUT, DELETE, etc.
}
