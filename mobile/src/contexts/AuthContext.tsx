import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, AuthError as SupabaseAuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { User } from '@/src/types';
import { getUserProfile } from '@/api/user';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: SupabaseAuthError | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any, data: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string): Promise<User | null> => {
    try {
      const userData = await getUserProfile(userId);
      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;
    let initialLoadDone = false;

    const loadSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!isMounted) return;
        setSession(session);

        if (session) {
          fetchUserData(session.user.id).then((userData) => {
            if (isMounted) {
              setUser(userData);
            }
          });
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
          initialLoadDone = true;
        }
      }
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        if (event === 'INITIAL_SESSION') return;

        setSession(session);

        if (event === 'SIGNED_IN') {
          router.replace('/(tabs)/(home)/home');
          if (session?.user && initialLoadDone) {
            fetchUserData(session.user.id).then((userData) => {
              if (isMounted) {
                setUser(userData);
              }
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          router.replace('/(auth)/sign-in');
        }
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        },
      },
    });

    if (data.user && !error) {
      try {
        const { error: profileError } = await supabase
          .from('user')
          .insert({
            id: data.user.id,
            email: email,
            username: username,
            total_books: 0,
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          return { error: profileError, data: null };
        }
      } catch (err) {
        console.error('Error creating user profile:', err);
        return { error: err as SupabaseAuthError, data: null };
      }
    }

    return { error, data };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshUser = async () => {
    if (session?.user) {
      const userData = await fetchUserData(session.user.id);
      if (userData) {
        setUser(userData);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut, refreshUser }}>
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