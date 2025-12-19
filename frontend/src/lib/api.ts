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

// let isRefreshing = false;
// let failedQueue: Array<{
//   resolve: (value?: unknown) => void;
//   reject: (reason?: any) => void;
// }> = [];

// const processQueue = (error: any): void => {
//   for (const { resolve, reject } of failedQueue) {
//     if (error) {
//       reject(error);
//     } else {
//       resolve();
//     }
//   }

//   failedQueue = [];
// };

API.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // const originalRequest = error.config;

    // if (error.response?.status === 401 && !originalRequest._retry) {
    //   if (isRefreshing) {
    //     return new Promise((resolve, reject) => {
    //       failedQueue.push({ resolve, reject })
    //     })
    //       .then(() => {
    //         return API(originalRequest)
    //       })
    //       .catch((err) => {
    //         return Promise.reject(err)
    //       })
    //   }

    //   originalRequest._retry = true
    //   isRefreshing = true

    //   try {
    //     console.info('[API] Recebeu 401, tentando refresh...')
    //     await refreshTokenServerFn()
    //     console.info('[API] Refresh bem-sucedido, processando fila')

    //     processQueue(null)

    //     return API(originalRequest)
    //   } catch (refreshError: any) {
    //     console.error('[API] Refresh falhou:', refreshError)
    //     processQueue(refreshError)

    //     if (
    //       refreshError?.response?.status === 401 ||
    //       refreshError?.message?.includes('No refresh token')
    //     ) {
    //       window.location.href = '/'
    //     }

    //     return Promise.reject(refreshError)
    //   } finally {
    //     isRefreshing = false
    //   }
    // }

    return Promise.reject(error);
  },
);

export { API };
