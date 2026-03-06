import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

interface ApiErrorShape {
  error: { code: string; message: string };
}

function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorShape | undefined;
    return data?.error?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}

// ── Signup ────────────────────────────────────────────────────────────────────
export function useSignup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signup = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await authApi.signup({ email, password });
      return true;
    } catch (err) {
      setError(extractErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { signup, loading, error };
}

// ── OTP Verify ────────────────────────────────────────────────────────────────
export function useVerifyOtp() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const verifyOtp = async (
    email: string,
    code: string,
    purpose: 'signup' | 'reset',
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.verifyOtp({ email, code, purpose });
      const { access_token, refresh_token, user } = res.data.data;
      if (purpose === 'signup') {
        setAuth(access_token, refresh_token, user);
        navigate('/dashboard');
      }
      return true;
    } catch (err) {
      setError(extractErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { verifyOtp, loading, error };
}

// ── Login ─────────────────────────────────────────────────────────────────────
export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login({ email, password });
      const { access_token, refresh_token, user } = res.data.data;
      setAuth(access_token, refresh_token, user);
      navigate('/dashboard');
      return true;
    } catch (err) {
      setError(extractErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}

// ── Logout ────────────────────────────────────────────────────────────────────
export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const navigate = useNavigate();

  const logout = async (): Promise<void> => {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // best-effort — clear locally regardless
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  return { logout };
}

// ── Reset Password ────────────────────────────────────────────────────────────
export function useResetPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestReset = async (email: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await authApi.resetPassword({ email });
      return true;
    } catch (err) {
      setError(extractErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const confirmReset = async (
    email: string,
    code: string,
    newPassword: string,
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await authApi.resetPasswordConfirm({
        email,
        code,
        new_password: newPassword,
      });
      return true;
    } catch (err) {
      setError(extractErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { requestReset, confirmReset, loading, error };
}
