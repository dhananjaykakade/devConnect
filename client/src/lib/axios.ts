// src/lib/axios.ts
import axios from 'axios';
import { refreshSession } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // required for cookies
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, user: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(user);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If unauthorized and not already retrying
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // queue all failed requests
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch(Promise.reject);
      }

      isRefreshing = true;

      try {
        const res = await refreshSession(); // should return new session or user

        if (res?.data?.user) {
          console.log("Session refreshed successfully", res.data.user);
          useAuthStore.getState().login(res.data.user, false);
          processQueue(null, res.data.user);
          return api(originalRequest);
        } else {
          useAuthStore.getState().logout();
          processQueue("Refresh failed", null);
          return Promise.reject(error);
        }
      } catch (err) {
        useAuthStore.getState().logout();
        processQueue(err, null);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
