export type AuthProvider = 'password' | 'google';

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type ForgotPasswordInput = {
  email: string;
};

