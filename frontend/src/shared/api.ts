import axios from 'axios';
import { auth } from './firebase';

// Force the API URL to be the backend port
// TODO: Fix environment variable loading - React requires server restart after .env changes
const API_URL = 'http://localhost:3000';

// Log API URL in development to help debug
console.log('Environment REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('Using API Base URL:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const idToken = await user.getIdToken();
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${idToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Silently handle 404 errors - don't show them to users
    if (error.response?.status === 404) {
      return Promise.reject(new Error(''));
    }
    // Handle other errors
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

