import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Enterprise Base API URL from Environment Variable (Normalizing /api suffix)
let rawBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8085/api';
if (rawBaseUrl && !rawBaseUrl.endsWith('/api') && !rawBaseUrl.endsWith('/api/')) {
  rawBaseUrl = rawBaseUrl.replace(/\/+$/, '') + '/api';
}
const API_BASE_URL = rawBaseUrl;

export const axiosClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor: Automatically attach JWT Bearer Token if logged in
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const token = window.localStorage.getItem('jwtToken');
        const isAuthCall = config.url && (config.url.includes('/auth/login') || config.url.includes('/auth/register'));
        if (token && config.headers && !isAuthCall) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.warn('Axios interceptor token read warning:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Centralized Error Handling & Response Normalization
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'An unexpected API error occurred';
    const isAuthCall = error.config?.url && (error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register'));

    if (status === 401 && !isAuthCall) {
      console.warn('Unauthorized request - session expired or invalid credentials');
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('jwtToken');
        window.localStorage.removeItem('userObj');
        window.localStorage.removeItem('loginTimestamp');
        window.dispatchEvent(new Event('auth_session_expired'));
      }
    } else if (status === 403) {
      console.warn('Forbidden resource access - insufficient privilege role');
    }

    return Promise.reject({
      status,
      message,
      originalError: error,
    });
  }
);
