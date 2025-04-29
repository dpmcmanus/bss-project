import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://zrjcsgkxcawttvamebng.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyamNzZ2t4Y2F3dHR2YW1lYm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3ODY5NzUsImV4cCI6MjA2MTM2Mjk3NX0.aN6ZVRdputjUei6xoUrq2u8ei2DW1pFg5_UWZxwR5MU";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true
    },
    db: {
      schema: 'public'
    }
  }
);