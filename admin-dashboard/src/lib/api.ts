import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('admin_token');
    const adminKey = Cookies.get('admin_key');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (adminKey) {
      config.headers['X-Admin-Key'] = adminKey;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      Cookies.remove('admin_token');
      Cookies.remove('admin_key');
      Cookies.remove('admin_user');
      window.location.href = '/auth/login';
    }
    
    // Show error toast
    const message = error.response?.data?.message || error.message || 'An error occurred';
    toast.error(message);
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },
  
  register: async (userData: {
    username: string;
    email: string;
    password: string;
    role?: string;
  }) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },
  
  refreshToken: async () => {
    const response = await api.post('/api/auth/refresh-token');
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },
};

// Routes API
export const routesAPI = {
  getAll: async () => {
    const response = await api.get('/api/routes');
    return response.data;
  },
  
  create: async (routeData: { from: string; to: string; description?: string }) => {
    const response = await api.post('/api/admin/routes', routeData);
    return response.data;
  },
  
  update: async (id: string, routeData: Partial<{ from: string; to: string; description: string }>) => {
    const response = await api.put(`/api/admin/routes/${id}`, routeData);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/api/admin/routes/${id}`);
    return response.data;
  },
};

// Vehicles API
export const vehiclesAPI = {
  getAll: async () => {
    const response = await api.get('/api/admin/vehicles');
    return response.data;
  },
  
  getByRoute: async (routeId: string) => {
    const response = await api.get(`/api/vehicles/${routeId}`);
    return response.data;
  },
  
  create: async (vehicleData: {
    name: string;
    type: string;
    routeId: string;
    bookingType: string;
    seatCount: number;
    pricePerSeat: number;
    imageUrl?: string;
  }) => {
    const response = await api.post('/api/admin/vehicles', vehicleData);
    return response.data;
  },
  
  update: async (id: string, vehicleData: Partial<{
    name: string;
    type: string;
    routeId: string;
    bookingType: string;
    seatCount: number;
    pricePerSeat: number;
    imageUrl: string;
  }>) => {
    const response = await api.put(`/api/admin/vehicles/${id}`, vehicleData);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/api/admin/vehicles/${id}`);
    return response.data;
  },
};

// Bookings API
export const bookingsAPI = {
  getAll: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await api.get('/api/admin/bookings', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/api/booking/status/${id}`);
    return response.data;
  },
  
  confirm: async (id: string) => {
    const response = await api.put(`/api/booking/confirm/${id}`);
    return response.data;
  },
  
  cancel: async (id: string) => {
    const response = await api.put(`/api/booking/cancel/${id}`);
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/api/admin/dashboard');
    return response.data;
  },
  
  unlockExpiredSeats: async () => {
    const response = await api.post('/api/admin/maintenance/unlock-expired-seats');
    return response.data;
  },
};

// Payments API
export const paymentsAPI = {
  getStatus: async (paymentId: string) => {
    const response = await api.get(`/api/payment/status/${paymentId}`);
    return response.data;
  },
  
  retry: async (paymentId: string) => {
    const response = await api.post(`/api/payment/retry/${paymentId}`);
    return response.data;
  },
};

export default api;