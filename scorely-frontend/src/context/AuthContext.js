import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authService } from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Sayfa yenilendiğinde token'ı kontrol et
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Token süresi dolmuş mu kontrol et
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          setCurrentUser(null);
        } else {
          // Kullanıcı bilgilerini getir
          authService.getProfile()
            .then(response => {
              setCurrentUser(response.data.user);
            })
            .catch(error => {
              console.error('Profil getirme hatası:', error);
              localStorage.removeItem('token');
              setCurrentUser(null);
            })
            .finally(() => {
              setLoading(false);
            });
        }
      } catch (error) {
        console.error('Token çözme hatası:', error);
        localStorage.removeItem('token');
        setCurrentUser(null);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Login fonksiyonu
  const login = async (email, password) => {
    try {
      const response = await authService.login({ email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setCurrentUser(user);
      return user;
    } catch (error) {
      console.error('Login hatası:', error);
      throw error;
    }
  };

  // Register fonksiyonu
  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      return response.data;
    } catch (error) {
      console.error('Kayıt hatası:', error);
      throw error;
    }
  };

  // Logout fonksiyonu
  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    setCurrentUser,
    login,
    register,
    logout,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}