import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

// Create Supabase client with service role key for full admin access
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test database connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('routes')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('Database connection error:', error.message);
    return false;
  }
};

// Database transaction helper
export const executeTransaction = async (queries) => {
  try {
    // Start transaction
    const results = [];
    
    for (const query of queries) {
      const result = await query();
      results.push(result);
      
      if (result.error) {
        throw new Error(`Transaction failed: ${result.error.message}`);
      }
    }
    
    return { success: true, results };
  } catch (error) {
    console.error('Transaction error:', error.message);
    return { success: false, error: error.message };
  }
};