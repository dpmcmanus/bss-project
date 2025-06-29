
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://zrjcsgkxcawttvamebng.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyamNzZ2t4Y2F3dHR2YW1lYm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3ODY5NzUsImV4cCI6MjA2MTM2Mjk3NX0.aN6ZVRdputjUei6xoUrq2u8ei2DW1pFg5_UWZxwR5MU";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Create a more flexible type that extends the Database type but allows for any RPC function
type DatabaseWithFunctions = Database & {
  public: {
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
  };
};

export const supabase = createClient<DatabaseWithFunctions>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'book-club-auth-token',
      storage: localStorage
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-application-name': 'book-club-app'
      }
    },
    // Enhanced realtime settings for better persistence
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);
