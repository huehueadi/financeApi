import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

type User = {
  _id: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user data from AsyncStorage on app start
    const loadUserData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('@budget_app_token');
        
        if (storedToken) {
          // Set token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // Fetch user profile
          const response = await api.get('/users/profile');
          
          setUser(response.data);
          setToken(storedToken);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        // Clear any invalid data
        await AsyncStorage.removeItem('@budget_app_token');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const storeUserData = async (userData: User, userToken: string) => {
    try {
      await AsyncStorage.setItem('@budget_app_token', userToken);
      
      // Set token in API headers for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
      
      setUser(userData);
      setToken(userToken);
    } catch (error) {
      console.error('Error storing user data:', error);
      throw new Error('Failed to store user data');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('sending Response:', email, password); // Debugging

      const response = await api.post('/users/login', { email, password });
  
      console.log('Backend Response:', response.data); // Debugging
  
      const { _id, name, email: userEmail, token } = response.data;
      const userData = { _id, name, email: userEmail };
  
      await storeUserData(userData, token);
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };
  
  

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const response = await api.post('/users/register', { name, email, password });
      
      const { user: userData, token: userToken } = response.data;
      
      await storeUserData(userData, userToken);
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('Registration failed. Email may already be in use.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Clear token from AsyncStorage
      await AsyncStorage.removeItem('@budget_app_token');
      
      // Clear token from API headers
      delete api.defaults.headers.common['Authorization'];
      
      // Reset state
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: any) => {
    try {
      setIsLoading(true);
      
      const response = await api.put('/users/profile', data);
      
      setUser(response.data);
    } catch (error) {
      console.error('Update profile error:', error);
      throw new Error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};