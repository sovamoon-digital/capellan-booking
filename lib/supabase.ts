import { createClient } from '@supabase/supabase-js';

const DUMMY = 'http://localhost';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || DUMMY,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon'
);

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || DUMMY,
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'service'
);
