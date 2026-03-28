export type AuthModuleUser = {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
};

export type AuthCurrentUserResponse = {
  user: AuthModuleUser | null;
  isAdmin?: boolean;
};

export type AuthLoginPayload = {
  email: string;
  password: string;
};

export type AuthSignupPayload = {
  email: string;
  password: string;
  locale: string;
};

export type AuthForgotPasswordPayload = {
  email: string;
  locale: string;
};

export type AuthResetPasswordPayload = {
  token: string;
  password: string;
};

