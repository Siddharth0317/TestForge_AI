import { apiRequest } from './api';

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'qa_engineer' | 'viewer';
  status?: string;
  created_at?: string;
}

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('testforge_token', res.token);
    return res;
  },

  async getCurrentUser(): Promise<UserProfile> {
    return apiRequest<UserProfile>('/auth/me');
  },

  logout(): void {
    localStorage.removeItem('testforge_token');
  },

  getToken(): string | null {
    return localStorage.getItem('testforge_token');
  }
};

