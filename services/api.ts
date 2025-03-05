import axios from 'axios';

// Create axios instance with base URL
export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // Server responded with an error status code
      if (error.response.status === 401) {
        // Unauthorized - token expired or invalid
        // You could trigger a logout here or refresh token
        console.error('Authentication error:', error.response.data);
      } else if (error.response.status === 403) {
        // Forbidden
        console.error('Permission denied:', error.response.data);
      } else if (error.response.status === 404) {
        // Not found
        console.error('Resource not found:', error.response.data);
      } else {
        // Other server errors
        console.error('Server error:', error.response.data);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error - no response received:', error.request);
    } else {
      // Error in setting up the request
      console.error('Request configuration error:', error.message);
    }
    
    // Pass the error down to the calling function
    return Promise.reject(error);
  }
);

// Export a function to set the auth token
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};