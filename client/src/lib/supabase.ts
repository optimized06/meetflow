import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'mock_url';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock_key';

// Only create a real client if we have actual credentials, otherwise we'll handle mock auth in AuthContext
export const supabase = supabaseUrl !== 'mock_url' 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
