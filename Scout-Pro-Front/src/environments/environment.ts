export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY',
  socketUrl: 'http://localhost:3000',
  uploadUrl: 'http://localhost:8000/uploads',
  maxUploadSize: 5242880, // 5MB in bytes
  supportedImageTypes: ['image/jpeg', 'image/png'],
  supportedVideoTypes: ['video/mp4', 'video/webm'],
  // ... other environment variables
};
