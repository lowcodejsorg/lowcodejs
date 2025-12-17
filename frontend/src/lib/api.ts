import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  withCredentials: true,
});

// const ID = localStorage.getItem(APP_ID) ?? null;

// if (!ID) {
//   localStorage.clear();
//   sessionStorage.clear();
//   window.location.reload();
// }

API.interceptors.request.use(
  async function (config) {
    return config;
  },
  function (error) {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    return Promise.reject(error);
  }
);

export { API };
