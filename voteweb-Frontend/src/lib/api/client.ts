// API Client for VoteWeb Backend
// Backend: Railway (vote-main-production.up.railway.app)
// Uses session cookies + CSRF tokens for authentication

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://vote-main-production.up.railway.app/api/v1";

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

class ApiClient {
  private csrfToken: string | null = null;

  async getCsrfToken(): Promise<string> {
    if (this.csrfToken) return this.csrfToken;

    try {
      const res = await fetch(`${API_BASE}/auth/csrf`, {
        credentials: 'include'
      });
      const data = await res.json();
      this.csrfToken = data.data?.csrfToken || '';
      return this.csrfToken;
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
      return '';
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      };

      // Add CSRF token for state-changing requests
      if (options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method)) {
        const csrf = await this.getCsrfToken();
        if (csrf) {
          headers['X-CSRF-Token'] = csrf;
        }
      }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          error: data.error?.message || data.error || `HTTP ${res.status}`,
        };
      }

      return { data: data.data || data };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Network error';
      console.error(`API Error [${endpoint}]:`, message);
      return { error: message };
    }
  }

  // Public HTTP methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
export default api;
