import axios from 'axios';
import { auth } from './firebase';

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
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

