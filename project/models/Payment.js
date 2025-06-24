import { supabase } from '../config/db.js';

export class Payment {
  constructor(data) {
    this.id = data.id;
    this.bookingId = data.booking_id;
    this.amount = parseFloat(data.amount);
    this.currency = data.currency;
    this.status = data.status; // 'pending', 'success', 'failed', 'refunded'
    this.gateway = data.gateway; // 'payhere'
    this.transactionId = data.transaction_id;
    this.paymentIntentId = data.payment_intent_id;
    this.gatewayResponse = data.gateway_response;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static async create(paymentData) {
    try {
      // Validate required fields
      if (!paymentData.bookingId || !paymentData.amount) {
        throw new Error('Booking ID and amount are required');
      }

      const { data, error } = await supabase
        .from('payments')
        .insert([{
          booking_id: paymentData.bookingId,
          amount: parseFloat(paymentData.amount),
          currency: paymentData.currency || 'LKR',
          status: 'pending',
          gateway: paymentData.gateway || 'payhere',
          payment_intent_id: paymentData.paymentIntentId,
          gateway_response: paymentData.gatewayResponse || {}
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: new Payment(data) };
    } catch (error) {
      console.error('Payment creation error:', error);
      return { success: false, error: error.message };
    }
  }

  static async findByBookingId(bookingId) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data.map(payment => new Payment(payment)) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async findByTransactionId(transactionId) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();

      if (error) throw error;
      return { success: true, data: new Payment(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async findByPaymentIntentId(paymentIntentId) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('payment_intent_id', paymentIntentId)
        .single();

      if (error) throw error;
      return { success: true, data: new Payment(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async updateStatus(id, status, transactionId = null, gatewayResponse = null) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      if (transactionId) updateData.transaction_id = transactionId;
      if (gatewayResponse) {
        // Merge with existing gateway response
        const existingPayment = await this.findById(id);
        const existingResponse = existingPayment.success ? existingPayment.data.gatewayResponse : {};
        updateData.gateway_response = { ...existingResponse, ...gatewayResponse };
      }

      const { data, error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: new Payment(data) };
    } catch (error) {
      console.error('Payment status update error:', error);
      return { success: false, error: error.message };
    }
  }

  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          bookings:booking_id (
            id,
            booking_reference,
            customer_name,
            email,
            total_amount,
            status
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data: new Payment(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getStats() {
    try {
      // Get successful payments
      const { data: successfulPayments, error: successError } = await supabase
        .from('payments')
        .select('amount, created_at')
        .eq('status', 'success');

      if (successError) throw successError;

      // Calculate totals
      const totalRevenue = successfulPayments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;
      
      // Get today's payments
      const today = new Date().toISOString().split('T')[0];
      const todayPayments = successfulPayments?.filter(payment => 
        payment.created_at.startsWith(today)
      ) || [];
      
      const todayRevenue = todayPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

      // Get all payment counts
      const { data: allPayments, error: allError } = await supabase
        .from('payments')
        .select('id, status, created_at');

      if (allError) throw allError;

      const todayAllPayments = allPayments?.filter(payment => 
        payment.created_at.startsWith(today)
      ) || [];

      return {
        success: true,
        data: {
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          todayRevenue: parseFloat(todayRevenue.toFixed(2)),
          totalTransactions: successfulPayments?.length || 0,
          todayTransactions: todayPayments.length,
          totalPaymentAttempts: allPayments?.length || 0,
          todayPaymentAttempts: todayAllPayments.length,
          successRate: allPayments?.length > 0 ? 
            ((successfulPayments?.length || 0) / allPayments.length * 100).toFixed(2) : 0
        }
      };
    } catch (error) {
      console.error('Payment stats error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get failed payments for retry
  static async getFailedPayments(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          bookings:booking_id (
            id,
            booking_reference,
            customer_name,
            email
          )
        `)
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { success: true, data: data.map(payment => new Payment(payment)) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Refund payment
  static async refund(id, reason = 'Customer request') {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({
          status: 'refunded',
          gateway_response: {
            refundReason: reason,
            refundedAt: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('status', 'success') // Only refund successful payments
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: new Payment(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}