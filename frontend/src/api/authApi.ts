import { axiosClient } from './axiosClient';

export interface LoginPayload {
  username: string; // Accepts email or username
  password: string;
}

export interface AuthResponseData {
  userId?: number;
  token: string;
  username: string;
  email: string;
  fullName: string;
  role: 'STUDENT' | 'MANAGER' | 'ADMIN';
  streak: number;
  totalXp: number;
}

export const authApi = {
  /**
   * Enterprise Login Call via Axios
   */
  async login(credentials: LoginPayload): Promise<AuthResponseData> {
    const response = await axiosClient.post<AuthResponseData>('/auth/login', credentials);
    const data = response.data;
    if (data && data.token) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('jwtToken', data.token);
        window.localStorage.setItem('userObj', JSON.stringify(data));
      }
    }
    return data;
  },

  /**
   * Enterprise Register Call via Axios
   */
  async register(userData: any): Promise<AuthResponseData> {
    const response = await axiosClient.post<AuthResponseData>('/auth/register', userData);
    const data = response.data;
    if (data && data.token) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('jwtToken', data.token);
        window.localStorage.setItem('userObj', JSON.stringify(data));
      }
    }
    return data;
  },

  /**
   * Logout helper clearing session token
   */
  logout(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('jwtToken');
      window.localStorage.removeItem('userObj');
    }
  }
};
