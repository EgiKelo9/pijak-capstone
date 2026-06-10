import { User } from "@/types";
import { useRouter } from 'next/navigation';
import { deleteCookie, setCookie } from '@/lib/utils';
import { useCallback, useEffect, useState } from 'react';
import { register, login, logout } from "@/services/auth";

export const getUserFromCookies = (): User | null => {
  const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
    const index = cookie.indexOf('=');
    if (index === -1) return acc;
    const key = cookie.substring(0, index);
    const value = cookie.substring(index + 1);
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  if (cookies.access_token && cookies.name) {
    return {
      id: cookies.id,
      name: cookies.name || '',
      email: cookies.email || '',
      accessToken: cookies.access_token,
      tokenType: cookies.token_type,
    };
  }

  return null;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = getUserFromCookies();
    if (userData) {
      setUser(userData);
    }
    setLoading(false);
  }, []);

  const isRegister = async (name: string, email: string, password: string, passwordConfirmation: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await register(name, email, password, passwordConfirmation);
      if (response.error) {
        throw new Error(response.message || 'Registration failed');
      }
      
      router.push(`/login?message=${response.message || 'Registration successful. Please login.'}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error occurred during registration';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  const isLogin = async (email: string, password: string, remember?: boolean) => {
    try {
      setError(null);
      setLoading(true);

      const response = await login(email, password);
      const data = response.data
      console.log(data)
      const userData = {
        id: data.id,
        name: data.name,
        email: data.email,
        accessToken: data.access_token || data.accessToken,
        tokenType: data.token_type || data.tokenType,
      };
      setUser(userData);

      // const maxAge = remember ? 86_400 : 2_592_000;
      const maxAge = 86_400;

      setCookie('access_token', userData.accessToken, maxAge);
      setCookie('token_type', userData.tokenType, maxAge);
      setCookie('name', userData.name, maxAge);
      setCookie('email', userData.email, maxAge);

      router.push('/dasbor');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error occurred during login';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const isLogout = async () => {
    let message = 'Logged out successfully.';
    try {
      setError(null);
      setLoading(true);

      const response = await logout();
      if (response.error) {
        throw new Error(response.message || 'Logout failed');
      }

      message = response.message || message;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error occurred during logout';
      setError(errorMessage);
      throw err;
    } finally {
      deleteCookie('access_token');
      deleteCookie('token_type');
      deleteCookie('name');
      deleteCookie('email');

      setUser(null);
      setLoading(false);
      router.push(`/login?message=${message}`);
    }
  }

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  return {
    user,
    loading,
    error,
    isRegister,
    isLogin,
    isLogout,
    clearError,
  }
}