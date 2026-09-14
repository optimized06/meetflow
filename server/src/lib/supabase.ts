import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('Supabase client initialized.');
} else {
  console.warn('WARNING: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing in environment variables. Running in mock/in-memory mode.');
}

export { supabase };
