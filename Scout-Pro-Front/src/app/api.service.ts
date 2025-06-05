import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, tap, Subject } from 'rxjs';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private followStatusChanged = new Subject<{userId: string | number, following: boolean}>();

  followStatusChanged$ = this.followStatusChanged.asObservable();

  constructor(private http: HttpClient, private router: Router) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
  }

  getData(endpoint: string, params?: any): Observable<any> {
    const options = {
      headers: this.getHeaders(),
      params: new HttpParams({ fromObject: params || {} })
    };
    return this.http.get(`${this.apiUrl}/${endpoint}`, options);
  }

  postData(endpoint: string, data: any): Observable<any> {
    const token = localStorage.getItem('auth_token');
    const headers = token ? new HttpHeaders({
      'Authorization': `Bearer ${token}`
    }) : undefined;

    return this.http.post(`${this.apiUrl}/${endpoint}`, data, { headers });
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  loginWithGoogle(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login/google/callback`, data);
  }

  getUserProfile(endpoint?: string): Observable<any> {
    const userType = localStorage.getItem('user_type');
    endpoint = endpoint || (userType === 'scout' ? 'profile' : 'profile');

    return this.http.get(`${this.apiUrl}/${endpoint}`, { headers: this.getHeaders() }).pipe(
      tap(response => {
        console.log('Profile response:', response);
      })
    );
  }

  getPlayerProfile(playerId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/players/${playerId}`, { headers: this.getHeaders() });
  }

  followPlayer(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${userId}/follow`, {}, { headers: this.getHeaders() });
  }

  unfollowPlayer(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${userId}/unfollow`, {}, { headers: this.getHeaders() });
  }

  getFollowStatus(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${userId}/follow-status`, { headers: this.getHeaders() });
  }

  getContactedPlayers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/scout/contacted-players`, { headers: this.getHeaders() });
  }

  updatePlayerProfile(profileData: any): Observable<any> {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

      // Create FormData for file uploads
      const formData = new FormData();

      // Add all profile fields to formData
      for (const key in profileData) {
      if (key === 'profile_image' && profileData[key] instanceof File) {
              formData.append(key, profileData[key]);
      } else if (key === 'secondary_position' || key === 'previous_clubs') {
        formData.append(key, JSON.stringify(profileData[key]));
          } else {
            formData.append(key, profileData[key]);
          }
        }

    return this.http.put(`${this.apiUrl}/player/profile/update`, formData, { headers });
  }

  updateScoutProfile(profileData: any): Observable<any> {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Create FormData for file uploads
    const formData = new FormData();

    // Add all profile fields to formData
    for (const key in profileData) {
      if ((key === 'profile_image' || key === 'id_proof') && profileData[key] instanceof File) {
        formData.append(key, profileData[key]);
      } else if (key === 'certifications' && Array.isArray(profileData[key])) {
        profileData[key].forEach((cert: any, index: number) => {
          formData.append(`certifications[${index}]`, cert);
        });
      } else if (key === 'age_groups' && Array.isArray(profileData[key])) {
        profileData[key].forEach((group: string, index: number) => {
          formData.append(`age_groups[${index}]`, group);
        });
      } else {
        formData.append(key, profileData[key]);
      }
    }

    return this.http.post(`${this.apiUrl}/scout/update`, formData, { headers });
  }

  // Try different endpoint patterns to find the one that works
  tryUpdatePlayerProfile(profileData: any): Observable<any> {
    // First try the direct PUT request to the correct endpoint
    return this.updatePlayerProfileWithCorrectMethod(profileData).pipe(
      catchError(error => {
        console.log('Direct endpoint failed, trying fallback endpoints...');
        // Fall back to trying different endpoint patterns if the direct approach fails
        return this.updatePlayerProfileV1(profileData);
      }),
      catchError(error => {
        console.log('First endpoint failed, trying second endpoint...');
        return this.updatePlayerProfileV2(profileData);
      }),
      catchError(error => {
        console.log('Second endpoint failed, trying third endpoint...');
        return this.updatePlayerProfileV3(profileData);
      }),
      catchError(error => {
        console.log('Third endpoint failed, trying fourth endpoint...');
        return this.updatePlayerProfileV4(profileData);
      })
    );
  }

  // Primary attempt: Try the correct endpoint with proper HTTP method
  private updatePlayerProfileWithCorrectMethod(profileData: any): Observable<any> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return throwError(() => ({ message: 'Authentication token is missing' }));
    }

    console.log('Attempting to update player profile with PUT method');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // Create JSON object instead of FormData for PUT request
    const jsonData: any = {};

    // Convert FormData fields to JSON
    for (const key in profileData) {
      if (profileData[key] !== undefined && profileData[key] !== null) {
        // Handle arrays
        if (key === 'secondary_position' || key === 'previous_clubs') {
          if (Array.isArray(profileData[key])) {
            jsonData[key] = profileData[key];
          } else if (typeof profileData[key] === 'string') {
            jsonData[key] = [profileData[key]];
          } else {
            jsonData[key] = [];
          }
        }
        // Handle profile image - skip if it's a File
        else if (key === 'profile_image' && profileData[key] instanceof File) {
          // Skip file in JSON payload - can't send files in JSON
          continue;
        }
        // Handle other fields
        else {
          jsonData[key] = profileData[key];
        }
      }
    }

    // First try PUT with JSON data (no files)
    return this.http.put(`${this.apiUrl}/player/profile/update`, jsonData, { headers });
  }

  // First attempt: player-profile/update
  private updatePlayerProfileV1(profileData: any): Observable<any> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return throwError(() => ({ message: 'Authentication token is missing' }));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    const formData = this.createFormData(profileData);

    return this.http.post(`${this.apiUrl}/player-profile/update`, formData, { headers });
  }

  // Second attempt: players/update
  private updatePlayerProfileV2(profileData: any): Observable<any> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return throwError(() => ({ message: 'Authentication token is missing' }));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    const formData = this.createFormData(profileData);

    return this.http.post(`${this.apiUrl}/players/update`, formData, { headers });
  }

  // Third attempt: profile/update
  private updatePlayerProfileV3(profileData: any): Observable<any> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return throwError(() => ({ message: 'Authentication token is missing' }));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    const formData = this.createFormData(profileData);

    return this.http.post(`${this.apiUrl}/profile/update`, formData, { headers });
  }

  // Fourth attempt: player/profile/update
  private updatePlayerProfileV4(profileData: any): Observable<any> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return throwError(() => ({ message: 'Authentication token is missing' }));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'X-HTTP-Method-Override': 'PUT'  // Add this header to tell Laravel to treat as PUT
    });
    const formData = this.createFormData(profileData);

    // Use POST but with X-HTTP-Method-Override header to handle FormData properly
    return this.http.post(`${this.apiUrl}/player/profile/update`, formData, { headers });
  }

  // Helper method to create FormData
  private createFormData(profileData: any): FormData {
    const formData = new FormData();

    // Add all profile fields to formData
    for (const key in profileData) {
      if (profileData[key] !== undefined && profileData[key] !== null) {
        if (key === 'profile_image') {
          if (profileData[key] instanceof File) {
            console.log('Adding file to formData:', key, profileData[key].name);
            formData.append(key, profileData[key]);
          } else if (typeof profileData[key] === 'string' && profileData[key].trim() !== '') {
            // If it's a string path, we don't need to resend it unless it changed
            // The backend can handle the case where it's not provided if there's no change
            console.log('Keeping existing profile image path');
          }
        } else if (key === 'secondary_position' || key === 'previous_clubs') {
          if (Array.isArray(profileData[key])) {
            formData.append(key, JSON.stringify(profileData[key]));
          } else {
            formData.append(key, profileData[key]);
          }
        } else if (typeof profileData[key] === 'string') {
          console.log('Adding string field to formData:', key, profileData[key]);
          formData.append(key, profileData[key].trim());
        } else if (typeof profileData[key] === 'number') {
          console.log('Adding numeric field to formData:', key, profileData[key]);
          formData.append(key, profileData[key].toString());
        } else if (typeof profileData[key] === 'boolean') {
          console.log('Adding boolean field to formData:', key, profileData[key]);
          formData.append(key, profileData[key] ? '1' : '0');
        } else {
          console.log('Adding field to formData:', key, profileData[key]);
          formData.append(key, profileData[key]);
        }
      }
    }

    return formData;
  }

  uploadVideoChunk(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/videos/chunk`, formData, {
      headers: this.getHeaders()
    });
  }

  finalizeVideoUpload(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/videos/finalize`, data, {
      headers: this.getHeaders()
    });
  }

  uploadVideo(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/videos/upload`, formData, {
      headers: this.getHeaders()
    });
  }

  putData(endpoint: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${endpoint}`, data, { headers: this.getHeaders() });
  }

  deleteData(endpoint: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${endpoint}`, { headers: this.getHeaders() });
  }

  // Recent Searches Methods
  getRecentSearches(): Observable<any> {
    return this.getData('recent-searches');
  }

  deleteRecentSearch(term: string): Observable<any> {
    return this.postData('recent-searches/delete', { term });
  }

  addRecentSearch(term: string): Observable<any> {
    return this.postData('recent-searches/add', { term });
  }

  getVideoLikes(videoId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/videos/${videoId}/likes`, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching video likes:', error);
          return throwError(() => error);
        })
      );
  }

  emitFollowStatusChanged(data: {userId: string | number, following: boolean}) {
    this.followStatusChanged.next(data);
  }

  // Contact Request Methods
  sendContactRequest(playerId: number, message?: string) {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });
    return this.http.post(`${this.apiUrl}/contact-requests`, { player_id: playerId, message }, { headers });
  }

  checkContactRequestStatus(playerId: number) {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    });
    return this.http.get(`${this.apiUrl}/contact-requests/check/${playerId}`, { headers });
  }

  // Add more methods as needed for PUT, DELETE, etc.
}
