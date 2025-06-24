import cron from 'node-cron';
import { Seat } from '../models/Seat.js';

export class SeatLockTimer {
  static init() {
    // Run every 2 minutes to unlock expired seats
    cron.schedule('*/2 * * * *', async () => {
      try {
        console.log('🔄 Running seat lock cleanup...');
        await Seat.unlockExpiredSeats();
      } catch (error) {
        console.error('❌ Seat lock cleanup error:', error.message);
      }
    });

    console.log('✅ Seat lock timer initialized - runs every 2 minutes');
  }

  static async manualCleanup() {
    try {
      console.log('🔄 Manual seat lock cleanup started...');
      const result = await Seat.unlockExpiredSeats();
      console.log(`✅ Manual cleanup completed - unlocked ${result.count || 0} seats`);
      return result;
    } catch (error) {
      console.error('❌ Manual seat lock cleanup error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get lock expiration time for a seat
  static getLockExpirationTime() {
    return new Date(Date.now() + parseInt(process.env.SEAT_LOCK_DURATION || 600000));
  }

  // Check if a seat lock has expired
  static isLockExpired(lockedAt) {
    if (!lockedAt) return true;
    
    const lockTime = new Date(lockedAt);
    const expirationTime = new Date(lockTime.getTime() + parseInt(process.env.SEAT_LOCK_DURATION || 600000));
    
    return new Date() > expirationTime;
  }

  // Calculate remaining lock time in seconds
  static getRemainingLockTime(lockedAt) {
    if (!lockedAt) return 0;
    
    const lockTime = new Date(lockedAt);
    const expirationTime = new Date(lockTime.getTime() + parseInt(process.env.SEAT_LOCK_DURATION || 600000));
    const now = new Date();
    
    if (now > expirationTime) return 0;
    
    return Math.floor((expirationTime - now) / 1000);
  }
}

// Cache for seat locks to improve performance
export class SeatLockCache {
  static cache = new Map();
  static cacheTimeout = 30000; // 30 seconds

  static set(vehicleId, seats) {
    this.cache.set(vehicleId, {
      seats,
      timestamp: Date.now()
    });
    
    // Auto cleanup after timeout
    setTimeout(() => {
      this.cache.delete(vehicleId);
    }, this.cacheTimeout);
  }

  static get(vehicleId) {
    const cached = this.cache.get(vehicleId);
    
    if (!cached) return null;
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(vehicleId);
      return null;
    }
    
    return cached.seats;
  }

  static invalidate(vehicleId) {
    this.cache.delete(vehicleId);
  }

  static clear() {
    this.cache.clear();
  }

  static getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}