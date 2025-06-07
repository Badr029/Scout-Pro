import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private readonly storageUrl = environment.apiUrl.replace('/api', '/storage');

  getProfileImageUrl(user: any): string {
    if (!user) return this.getDefaultAvatarUrl('Unknown User');

    if (user.profile_image) {
      // Check if the profile_image is already a full URL
      if (user.profile_image.startsWith('http')) {
        return user.profile_image;
      }
      // If it's a storage path, prepend the storage URL
      return `${this.storageUrl}/${user.profile_image.replace(/^\/*/, '')}`;
    }

    // If no profile image, generate avatar with user's name
    return this.getDefaultAvatarUrl(user.name || `${user.first_name || ''} ${user.last_name || ''}`);
  }

  getDocumentUrl(documentPath: string): string {
    if (!documentPath) return '';

    // Check if it's already a full URL
    if (documentPath.startsWith('http')) {
      return documentPath;
    }

    // If it's a storage path, prepend the storage URL
    return `${this.storageUrl}/${documentPath.replace(/^\/*/, '')}`;
  }

  private getDefaultAvatarUrl(name: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim() || 'Unknown User')}&background=random`;
  }
}
