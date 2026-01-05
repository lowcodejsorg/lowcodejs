import axios from 'axios';

import { Env } from '@/env';

const API = axios.create({
  baseURL: Env.VITE_API_BASE_URL,
  withCredentials: true,
});

API.interceptors.request.use(
  function (config) {
    return config;
  },
  function (error) {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  },
);

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    // if (error.response?.status === 401) {
    //   localStorage.clear();

    //   try {
    //     await API.post('/authentication/sign-out');
    //   } catch (e) {
    //     console.error(e);
    //   }

    //   window.location.href = '/';
    // }
    return Promise.reject(error);
  },
);

export { API };
