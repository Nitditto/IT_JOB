// src/api.js

import axios from 'axios';

// Tạo một instance Axios với cấu hình chung
const api = axios.create({
  baseURL: '/api', // URL backend của bạn
  withCredentials: true, // Nếu bạn dùng cookie
  withXSRFToken: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN"
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

// Backend giờ bọc mọi response thành công trong ApiResponse<T>
// ({ success, data, message, timestamp }). Unwrap ở đây để code cũ
// đọc `res.data` (mong đợi payload thật) không phải sửa lại từng chỗ gọi.
api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;