import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { saveTokens, saveUser, getUser, getAccessToken, clearAll } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on app launch
    const restoreSession = async () => {
      try {
        const token = await getAccessToken();
        const savedUser = await getUser();
        if (token && savedUser) {
          setUser(savedUser);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login/', { email, password });
    const { access, refresh, user: userData } = res.data;
    await saveTokens(access, refresh);
    await saveUser(userData);
    setUser(userData);
    return userData;
  };

  const register = async (data) => {
    const res = await api.post('/api/auth/register/', data);
    const { access, refresh, user: userData } = res.data;
    await saveTokens(access, refresh);
    await saveUser(userData);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      const refresh = await AsyncStorage.getItem('@refresh_token');
      await api.post('/api/auth/logout/', { refresh });
    } catch {
      // ignore errors on logout
    } finally {
      await clearAll();
      setUser(null);
    }
  };

  const updateUser = async (updatedUser) => {
    await saveUser(updatedUser);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
