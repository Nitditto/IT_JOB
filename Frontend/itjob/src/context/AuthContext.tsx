// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import type { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null; // Define a proper User interface here
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {

    // This function runs once when the app loads
    const verifyUserSession = async () => {
      try {
        // Get our csrf token
        await axios.get(`${BACKEND_URL}/csrf`);
        console.log("CSRF token received");

        // Make a request to a backend endpoint that verifies the session
        const response = await axios.get(`${BACKEND_URL}/auth/me`); // A "who am I" endpoint
        setUser(response.data);
        console.log('User session verified.');
      } catch (error) {
        // If the request fails (e.g., 401 Unauthorized), the user is not logged in
        setUser(null);
        console.log('No active user session found.');
      }
    };
    verifyUserSession();
  }, []);

  const value = {
    isAuthenticated: !!user, // True if user object is not null
    user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to easily access the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};