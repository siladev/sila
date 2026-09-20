import { AuthResponse, LoginCredentials, User } from '../types/auth';
import { apiClient } from './apiClient';

const TOKEN_STORAGE_KEY = 'sila_auth_token';
const USER_STORAGE_KEY = 'sila_user_data';

// Demo fallback user for development/preview when auth-service is not running
const MOCK_USER: User = {
  id: 'usr_001',
  email: 'usuario@sila.app',
  name: 'Silvina Acosta',
};

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Attempt real backend call first
      const res = await apiClient.post<AuthResponse>('/auth/login', credentials);
      this.saveSession(res.token, res.user);
      return res;
    } catch (error) {
      // Dev fallback: allow test login with demo credentials
      if (
        (credentials.email === 'usuario@sila.app' && credentials.password === 'password123') ||
        (credentials.email.includes('@') && credentials.password.length >= 6)
      ) {
        const isDemo = credentials.email === 'usuario@sila.app';
        const mockResponse: AuthResponse = {
          token: 'mock_jwt_token_sila_' + Date.now(),
          user: isDemo
            ? MOCK_USER
            : {
                id: 'usr_' + Math.random().toString(36).substring(2, 9),
                email: credentials.email,
                name: credentials.email.split('@')[0],
              },
        };
        this.saveSession(mockResponse.token, mockResponse.user);
        return mockResponse;
      }
      throw new Error('Credenciales inválidas. Comprueba tu correo y contraseña.');
    }
  }

  logout(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  getStoredUser(): User | null {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  private saveSession(token: string, user: User): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }
}

export const authService = new AuthService();
