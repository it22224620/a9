import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'LKR') {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date) {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

export function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string) {
  const phoneRegex = /^[0-9+\-\s()]+$/;
  return phoneRegex.test(phone) && phone.length >= 10;
}

export function generateBookingReference() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TRV-${timestamp}-${randomId}`;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// PayHere integration utilities
export function loadPayHereScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.payhere) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.payhere.lk/lib/payhere.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load PayHere script'));
    document.head.appendChild(script);
  });
}

export function initializePayHere(config: any) {
  if (!window.payhere) {
    throw new Error('PayHere script not loaded');
  }

  return new Promise((resolve, reject) => {
    window.payhere.onCompleted = (orderId: string) => {
      resolve({ success: true, orderId });
    };

    window.payhere.onDismissed = () => {
      reject(new Error('Payment was dismissed by user'));
    };

    window.payhere.onError = (error: string) => {
      reject(new Error(`Payment error: ${error}`));
    };

    window.payhere.startPayment(config);
  });
}

// Seat selection utilities
export function generateSeatLayout(seatCount: number, vehicleType: string) {
  const seatsPerRow = vehicleType === 'bus' ? 4 : vehicleType === 'van' ? 3 : 2;
  const rows = Math.ceil(seatCount / seatsPerRow);
  
  const layout = [];
  for (let row = 0; row < rows; row++) {
    const rowSeats = [];
    for (let seat = 0; seat < seatsPerRow && (row * seatsPerRow + seat) < seatCount; seat++) {
      rowSeats.push({
        number: row * seatsPerRow + seat + 1,
        position: { row, seat }
      });
    }
    layout.push(rowSeats);
  }
  
  return layout;
}

export function calculateTotalPrice(seatCount: number, pricePerSeat: number, fees = 0) {
  const subtotal = seatCount * pricePerSeat;
  const total = subtotal + fees;
  return {
    subtotal,
    fees,
    total
  };
}

// Form validation utilities
export function validateBookingForm(data: any) {
  const errors: Record<string, string> = {};

  if (!data.customerName || data.customerName.trim().length < 2) {
    errors.customerName = 'Name must be at least 2 characters';
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.phone || !validatePhone(data.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Local storage utilities
export function saveBookingToStorage(bookingData: any) {
  try {
    localStorage.setItem('currentBooking', JSON.stringify(bookingData));
  } catch (error) {
    console.warn('Failed to save booking to localStorage:', error);
  }
}

export function loadBookingFromStorage() {
  try {
    const saved = localStorage.getItem('currentBooking');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('Failed to load booking from localStorage:', error);
    return null;
  }
}

export function clearBookingFromStorage() {
  try {
    localStorage.removeItem('currentBooking');
  } catch (error) {
    console.warn('Failed to clear booking from localStorage:', error);
  }
}

// URL utilities
export function createBookingShareUrl(bookingReference: string) {
  const baseUrl = window.location.origin;
  return `${baseUrl}/booking/success?booking=${bookingReference}`;
}

export function downloadBookingConfirmation(booking: any) {
  const content = `
NATURE TRAVEL BOOKING CONFIRMATION
================================

Booking Reference: ${booking.bookingReference}
Customer: ${booking.customerName}
Email: ${booking.email}
Phone: ${booking.phone}

Journey Details:
From: ${booking.route?.from}
To: ${booking.route?.to}
Vehicle: ${booking.vehicle?.name}
Seats: ${booking.seatIds?.length}
Amount: LKR ${booking.totalAmount?.toFixed(2)}

Status: ${booking.status}
Booked on: ${new Date(booking.createdAt).toLocaleDateString()}

Thank you for choosing Nature Travel!
  `;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `booking-${booking.bookingReference}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Type declarations for PayHere
declare global {
  interface Window {
    payhere: {
      startPayment: (config: any) => void;
      onCompleted: (orderId: string) => void;
      onDismissed: () => void;
      onError: (error: string) => void;
    };
  }
}