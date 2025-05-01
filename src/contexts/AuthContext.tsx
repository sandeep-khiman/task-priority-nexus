
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, AuthState } from '@/types/user';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: true,
  error: null
};

// Mock users for demo purposes
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    email: 'manager@example.com',
    name: 'Manager User',
    role: 'manager',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    email: 'teamlead@example.com',
    name: 'Team Lead',
    role: 'team-lead',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    email: 'employee@example.com',
    name: 'Employee',
    role: 'employee',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

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

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({
          isAuthenticated: true,
          user,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Failed to parse stored user', error);
        localStorage.removeItem('user');
        setAuthState({
          ...initialState,
          isLoading: false
        });
      }
    } else {
      setAuthState({
        ...initialState,
        isLoading: false
      });
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate API call
    setAuthState({
      ...authState,
      isLoading: true,
      error: null
    });

    // For demo, we'll use mock users
    const user = mockUsers.find(u => u.email === email);
    
    if (user && password === 'password') {
      // Simulate successful login
      localStorage.setItem('user', JSON.stringify(user));
      setAuthState({
        isAuthenticated: true,
        user,
        isLoading: false,
        error: null
      });
    } else {
      // Simulate login failure
      setAuthState({
        ...authState,
        isLoading: false,
        error: 'Invalid email or password'
      });
    }
  };

  const register = async (email: string, password: string, name: string) => {
    // Simulate API call
    setAuthState({
      ...authState,
      isLoading: true,
      error: null
    });

    // Check if user already exists
    const userExists = mockUsers.some(u => u.email === email);
    
    if (!userExists) {
      // In a real app, would save to backend
      const newUser: User = {
        id: `${mockUsers.length + 1}`,
        email,
        name,
        role: 'employee', // Default role
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockUsers.push(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setAuthState({
        isAuthenticated: true,
        user: newUser,
        isLoading: false,
        error: null
      });
    } else {
      setAuthState({
        ...authState,
        isLoading: false,
        error: 'Email already in use'
      });
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null
    });
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    // Simulate API call
    setAuthState({
      ...authState,
      isLoading: true
    });

    const userIndex = mockUsers.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        role,
        updatedAt: new Date().toISOString()
      };
      
      // If this is the current user, update their stored data
      if (authState.user && authState.user.id === userId) {
        const updatedUser = mockUsers[userIndex];
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setAuthState({
          ...authState,
          user: updatedUser,
          isLoading: false
        });
      } else {
        setAuthState({
          ...authState,
          isLoading: false
        });
      }
    } else {
      setAuthState({
        ...authState,
        isLoading: false,
        error: 'User not found'
      });
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    updateUserRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
