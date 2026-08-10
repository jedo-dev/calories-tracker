import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3000');

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Протухший/невалидный токен: чистим его и уводим на логин, вместо того чтобы
// молча показывать пустые страницы. Запросы самого логина (auth/*) не трогаем —
// там 401 значит «неверный пароль», его обрабатывает форма.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url: string = error.config?.url || '';
    const isAuthRequest = url.includes('/auth/');
    const onLoginPage =
      window.location.pathname === '/login' || window.location.pathname === '/register';

    if (status === 401 && !isAuthRequest && !onLoginPage && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

