import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, User } from '@/types/user';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  team_id?: string;
  avatar_url?: string;
  manager_id?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: SupabaseUser | null;
  session: Session | null;
  profile: User | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  updateUserProfile: (userId: string, updates: {
    name?: string;
    email?: string;
    avatar_url?: string;
  }) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  error: null
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialState);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch profile data for a user
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      // Convert DB format to app format
      return data ? {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role as UserRole,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        managerId: data.manager_id,
        avatar_url: data.avatar_url,
      } as User : null;
    } catch (error) {
      console.error('Exception fetching profile:', error);
      return null;
    }
  };

  // Set up auth state listener and check for existing session
  useEffect(() => {
    // Always set up the auth listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState(prev => ({
          ...prev,
          isLoading: true,
        }));

        // Use setTimeout to prevent potential deadlocks
        setTimeout(async () => {
          if (session?.user) {
            const profile = await fetchProfile(session.user.id);
            
            setAuthState({
              isAuthenticated: true,
              user: session.user,
              session,
              profile,
              isLoading: false,
              error: null
            });
          } else {
            setAuthState({
              isAuthenticated: false,
              user: null,
              session: null,
              profile: null,
              isLoading: false,
              error: null
            });
          }
        }, 0);
      }
    );

    // Then check for existing session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        
        setAuthState({
          isAuthenticated: true,
          user: session.user,
          session,
          profile,
          isLoading: false,
          error: null
        });
      } else {
        setAuthState({
          ...initialState,
          isLoading: false
        });
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (!authState.user) return;
    
    try {
      const profile = await fetchProfile(authState.user.id);
      if (profile) {
        setAuthState(prev => ({
          ...prev,
          profile
        }));
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const login = async (email: string, password: string) => {
    setAuthState({ ...authState, isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        setAuthState({ ...authState, isLoading: false, error: error.message });
        toast({
          title: 'Login failed',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        // Auth state will be updated by the listener
        toast({
          title: 'Logged in successfully',
          description: 'Welcome back!'
        });
        navigate('/');
      }
    } catch (error: any) {
      setAuthState({ 
        ...authState, 
        isLoading: false, 
        error: error.message || 'An unexpected error occurred'
      });
      toast({
        title: 'Login failed',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  };

  const register = async (email: string, password: string, name: string, role: UserRole = 'employee') => {
    setAuthState({ ...authState, isLoading: true, error: null });
    
    try {
      // Register with additional user metadata
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            name,
            role
          }
        }
      });
      
      if (error) {
        setAuthState({ ...authState, isLoading: false, error: error.message });
        toast({
          title: 'Registration failed',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Registration successful',
          description: 'Welcome to Task Priority Nexus!'
        });
        navigate('/');
      }
    } catch (error: any) {
      setAuthState({ 
        ...authState, 
        isLoading: false, 
        error: error.message || 'An unexpected error occurred'
      });
      toast({
        title: 'Registration failed',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  };

  const logout = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
  
      if (session) {
        await supabase.auth.signOut();
      }
  
      navigate('/login');
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    } catch (error: any) {
      toast({
        title: 'Logout failed',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };
  
  
  const updateUserRole = async (userId: string, role: UserRole) => {
    setAuthState({ ...authState, isLoading: true });
    
    try {
      // Use the edge function for updating roles
      const { error: rpcError } = await supabase.functions.invoke('update-user-role', {
        body: { user_id: userId, new_role: role }
      });
      
      if (rpcError) {
        throw rpcError;
      }
      
      // If this is the current user, update their profile
      if (authState.user && authState.user.id === userId) {
        await refreshProfile();
      }
      
      setAuthState(prev => ({ ...prev, isLoading: false }));
      toast({
        title: 'Success',
        description: 'User role updated successfully.'
      });
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user role',
        variant: 'destructive'
      });
    }
  };

  const updateUserProfile = async (userId: string, updates: {
    name?: string;
    email?: string;
    avatar_url?: string;
  }) => {
    if (!authState.user) return;
    
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      // If updating current user's profile, refresh it
      if (authState.user.id === userId) {
        await refreshProfile();
      }
      
      setAuthState(prev => ({ ...prev, isLoading: false }));
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.'
      });
      
      return true;
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      console.error(error);
      
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      });
      
      return false;
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    updateUserRole,
    updateUserProfile,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
