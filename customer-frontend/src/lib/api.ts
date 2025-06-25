import axios from 'axios';

const API_URL = 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Routes API
export const getAllRoutes = async () => {
  const response = await api.get('/api/routes');
  return response.data;
};

// Vehicles API
export const getVehiclesByRoute = async (routeId: string) => {
  const response = await api.get(`/api/vehicles/${routeId}`);
  return response.data;
};

export const getVehicleDetails = async (vehicleId: string) => {
  const response = await api.get(`/api/vehicle/${vehicleId}`);
  return response.data;
};

// Seats API
export const getSeatLayout = async (vehicleId: string, travelDate?: string) => {
  const params = travelDate ? { travelDate } : {};
  const response = await api.get(`/api/seats/${vehicleId}`, { params });
  return response.data;
};

export const lockSeats = async (seatIds: string[], customerEmail: string, travelDate?: string) => {
  const response = await api.post('/api/seats/lock', {
    seatIds,
    customerEmail,
    travelDate,
  });
  return response.data;
};

// Booking API
export const createBooking = async (bookingData: {
  customerName: string;
  email: string;
  phone: string;
  message: string;
  routeId: string;
  vehicleId: string;
  seatIds: string[];
  bookingType: string;
  travelDate?: string;
}) => {
  const response = await api.post('/api/booking/create', bookingData);
  return response.data;
};

export const getBookingStatus = async (id: string, type: 'id' | 'reference' = 'id') => {
  const response = await api.get(`/api/booking/status/${id}?type=${type}`);
  return response.data;
};

// Payment API
export const createPaymentIntent = async (data: { bookingId: string }) => {
  const response = await api.post('/api/payment/create-intent', data);
  return response.data;
};

export const getPaymentStatus = async (paymentId: string) => {
  const response = await api.get(`/api/payment/status/${paymentId}`);
  return response.data;
};

export default api;