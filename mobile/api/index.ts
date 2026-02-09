import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const getDefaultBackendUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:4040';
  }
  return 'http://localhost:4040';
};

const baseURL = BACKEND_URL ? `${BACKEND_URL}/api` : `${getDefaultBackendUrl()}/api`;

if (!BACKEND_URL) {
  const defaultUrl = getDefaultBackendUrl();
  console.warn(
    'EXPO_PUBLIC_BACKEND_URL is not set. Using default:',
    defaultUrl,
    '\n\nFor mobile devices, this will NOT work!',
    '\n   1. Find your computer\'s IP: ifconfig (Mac/Linux) or ipconfig (Windows)',
    '\n   2. Create mobile/.env file with:',
    `\n      EXPO_PUBLIC_BACKEND_URL=http://YOUR_IP:4040`,
    '\n   3. Restart Expo: npx expo start -c'
  );

  if (Platform.OS !== 'web' && defaultUrl.includes('localhost')) {
    console.error(
      '\nCRITICAL: localhost will not work on mobile devices!',
      '\n   Please set EXPO_PUBLIC_BACKEND_URL in mobile/.env',
      '\n   See mobile/TROUBLESHOOTING.md for help\n'
    );
  }
}

export const axiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to automatically inject auth token
axiosInstance.interceptors.request.use(
  async (config) => {
    // Automatically inject Bearer token for authenticated requests
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.error('Error getting session for request:', error);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.code === 'ECONNABORTED') {
      const timeoutError = new Error('Request timeout. The server took too long to respond.');
      (timeoutError as any).isTimeout = true;
      console.error('Request Timeout:', baseURL);
      return Promise.reject(timeoutError);
    }

    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      const networkError = new Error(
        `Cannot connect to backend server at ${baseURL}.\n\n` +
        `Possible solutions:\n` +
        `1. Ensure the backend server is running (port 4040)\n` +
        `2. Check your EXPO_PUBLIC_BACKEND_URL environment variable\n` +
        `3. For mobile devices, use your computer's IP address instead of localhost\n` +
        `4. Verify CORS settings on the backend`
      );
      (networkError as any).isNetworkError = true;
      (networkError as any).baseURL = baseURL;
      console.error('Network Error:', {
        message: error.message,
        baseURL,
        code: error.code,
        config: error.config?.url
      });
      return Promise.reject(networkError);
    }

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;

      let message = data?.message || data?.error || 'An error occurred';

      if (status === 401) {
        message = 'Authentication required. Please sign in again.';
      } else if (status === 403) {
        message = 'You don\'t have permission to perform this action.';
      } else if (status === 404) {
        message = 'The requested resource was not found.';
      } else if (status === 500) {
        message = 'Server error. Please try again later.';
      }

      const apiError = new Error(message);
      (apiError as any).status = status;
      (apiError as any).data = data;

      if (process.env.NODE_ENV === 'development') {
        console.error('API Error:', {
          status,
          message,
          data,
          url: error.config?.url
        });
      }

      return Promise.reject(apiError);
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('Unknown API Error:', {
        message: error.message,
        code: error.code,
        config: error.config?.url
      });
    }

    return Promise.reject(error);
  }
);