import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://afqqztcarqhtyijcafvz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcXF6dGNhcnFodHlpamNhZnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4ODQ0MzgsImV4cCI6MjA2MTQ2MDQzOH0.xQM2YxjXmVSJAW_vNotG1f-fzX77XRlO0W5SJeA5PO4";

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