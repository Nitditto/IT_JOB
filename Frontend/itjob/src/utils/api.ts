// src/api.js

import axios from 'axios';

// Tạo một instance Axios với cấu hình chung
const api = axios.create({
  baseURL: 'http://localhost:8080', // URL backend của bạn
  withCredentials: true, // Nếu bạn dùng cookie
});

// ⭐ Đây là phần quan trọng nhất: Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage (hoặc bất cứ đâu bạn lưu nó)
    const token = localStorage.getItem('token');

    // Nếu token tồn tại, thêm nó vào header Authorization
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // Xử lý lỗi nếu có
    return Promise.reject(error);
  }
);

export default api;