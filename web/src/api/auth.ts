import client from './client';
import type { User } from '../types';

interface SignupPayload {
  email: string;
  password: string;
}

interface OTPVerifyPayload {
  email: string;
  code: string;
  purpose: 'signup' | 'reset';
}

interface LoginPayload {
  email: string;
  password: string;
}

interface ResetPasswordPayload {
  email: string;
}

interface ResetPasswordConfirmPayload {
  email: string;
  code: string;
  new_password: string;
}

interface MessageResponse {
  message: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

interface RefreshResponse {
  access_token: string;
}

export const authApi = {
  signup: (payload: SignupPayload) =>
    client.post<{ success: true; data: MessageResponse }>(
      '/api/auth/signup',
      payload,
    ),

  verifyOtp: (payload: OTPVerifyPayload) =>
    client.post<{ success: true; data: AuthResponse }>(
      '/api/auth/verify-otp',
      payload,
    ),

  login: (payload: LoginPayload) =>
    client.post<{ success: true; data: AuthResponse }>(
      '/api/auth/login',
      payload,
    ),

  refresh: (refreshToken: string) =>
    client.post<{ success: true; data: RefreshResponse }>('/api/auth/refresh', {
      refresh_token: refreshToken,
    }),

  resetPassword: (payload: ResetPasswordPayload) =>
    client.post<{ success: true; data: MessageResponse }>(
      '/api/auth/reset-password',
      payload,
    ),

  resetPasswordConfirm: (payload: ResetPasswordConfirmPayload) =>
    client.post<{ success: true; data: MessageResponse }>(
      '/api/auth/reset-password/confirm',
      payload,
    ),

  logout: (refreshToken: string) =>
    client.post<{ success: true; data: MessageResponse }>('/api/auth/logout', {
      refresh_token: refreshToken,
    }),
} as const;
