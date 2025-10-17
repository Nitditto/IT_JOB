import axios from 'axios';
import Cookies from 'js-cookie';

// Create a new Axios instance with a base URL
const apiClient = axios.create({
    baseURL: 'http://localhost:8080/api', // Your backend's base URL
    withCredentials: true, // Important for sending cookies
});

// Use an interceptor to automatically add the CSRF token to requests
apiClient.interceptors.request.use(
    (config) => {
        // Read the token from the cookie
        const csrfToken = Cookies.get('XSRF-TOKEN');

        // If the token exists, add it to the request header
        if (csrfToken) {
            config.headers['X-XSRF-TOKEN'] = csrfToken;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;