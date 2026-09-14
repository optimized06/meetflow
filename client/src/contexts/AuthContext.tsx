import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is in localStorage (Mock auth support)
    const initAuth = async () => {
      try {
        if (supabase) {
          // Real Supabase Auth
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
            });
          }
          
          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              setUser({
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
              });
            } else {
              setUser(null);
            }
          });
          
          return () => {
            subscription.unsubscribe();
          };
        } else {
          // Mock Auth - read from localStorage
          const mockUser = localStorage.getItem('mock_user');
          if (mockUser) {
            setUser(JSON.parse(mockUser));
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (supabase) {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
         setUser({
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
        });
      }
    } else {
      // Mock Login
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
      const usersStr = localStorage.getItem('mock_users_db') || '[]';
      const users = JSON.parse(usersStr);
      const existingUser = users.find((u: any) => u.email === email && u.password === password);
      
      if (!existingUser) {
        throw new Error('Invalid email or password (Mock DB)');
      }
      
      const loggedInUser: User = { id: existingUser.id, email: existingUser.email, name: existingUser.name };
      localStorage.setItem('mock_user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    if (supabase) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });
      if (error) throw error;
    } else {
      // Mock Sign up
      await new Promise(resolve => setTimeout(resolve, 800));
      const usersStr = localStorage.getItem('mock_users_db') || '[]';
      const users = JSON.parse(usersStr);
      
      if (users.some((u: any) => u.email === email)) {
        throw new Error('User already exists (Mock DB)');
      }
      
      const newUser = { id: Math.random().toString(36).substring(7), email, password, name };
      users.push(newUser);
      localStorage.setItem('mock_users_db', JSON.stringify(users));
      
      const loggedInUser: User = { id: newUser.id, email: newUser.email, name: newUser.name };
      localStorage.setItem('mock_user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
    }
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
    } else {
      await new Promise(resolve => setTimeout(resolve, 400));
      localStorage.removeItem('mock_user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
