
import { createContext, useContext, useState, ReactNode } from 'react';

// User type definition
type User = {
  id: string;
  name: string;
  email: string;
};

// Auth context type
type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
};

// Create context with default values
const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider props
type AuthProviderProps = {
  children: ReactNode;
};

// Mock user data (for prototype)
const MOCK_USER = {
  id: '1',
  name: 'Donovan McManus',
  email: 'donovan.mcmanus2020@gmail.com',
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(MOCK_USER); // For demo purposes, start authenticated

  // Sign in function (mock implementation)
  const signIn = async (email: string, password: string) => {
    // In a real app, this would call an authentication API
    if (email && password) {
      setUser(MOCK_USER);
    } else {
      throw new Error('Invalid credentials');
    }
  };

  // Sign up function (mock implementation)
  const signUp = async (name: string, email: string, password: string) => {
    // In a real app, this would call an authentication API
    if (name && email && password) {
      setUser({
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
      });
    } else {
      throw new Error('Missing required fields');
    }
  };

  // Sign out function
  const signOut = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
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
