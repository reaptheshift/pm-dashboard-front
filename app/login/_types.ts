export type AuthProvider = "google" | "apple";

export interface Credentials {
  email: string;
  password: string;
}

export interface AuthResult<TMeta = unknown> {
  success: boolean;
  message?: string;
  meta?: TMeta & { statusCode?: number };
}

export interface AuthSuccessResult {
  success: true;
  message: string;
  meta: { authToken?: string; statusCode?: number; user?: any };
}

export interface AuthErrorResult {
  success: false;
  message: string;
  meta: { statusCode: number };
}
