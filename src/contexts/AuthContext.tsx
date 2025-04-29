
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

// Profile type definition
type Profile = {
  id: string;
  name: string;
  bio?: string;
};

// Auth context type
type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

// Create context with default values
const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider props
type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid Supabase auth deadlocks
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching profile:', error);
        // If profile not found, we might need to create one
        if (error.code === 'PGRST116') {
          await createProfile(userId);
          return;
        }
        toast({
          title: "Profile error",
          description: "There was a problem loading your profile.",
          variant: "destructive"
        });
        return;
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Profile error",
        description: "There was a problem loading your profile.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create profile if doesn't exist
  const createProfile = async (userId: string) => {
    try {
      // Get user details to use for profile
      const { data: userData } = await supabase.auth.getUser();
      const name = userData?.user?.user_metadata?.name || 'New User';
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: name
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating profile:', error);
        toast({
          title: "Profile creation failed",
          description: "Could not create user profile.",
          variant: "destructive"
        });
        return;
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Error creating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  // Sign up function
  const signUp = async (name: string, email: string, password: string) => {
    // Create new auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        }
      }
    });

    if (authError) {
      toast({
        title: "Sign up failed",
        description: authError.message,
        variant: "destructive"
      });
      throw authError;
    }

    if (!authData.user) {
      toast({
        title: "Sign up failed",
        description: "User creation failed. Please try again.",
        variant: "destructive"
      });
      throw new Error('User creation failed');
    }

    // Profile will be created by the database trigger
    toast({
      title: "Account created",
      description: "Your account has been created successfully.",
    });
  };

  // Sign out function
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive"
      });
    }
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
