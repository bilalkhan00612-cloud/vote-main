// API Client for VoteWeb Backend
// Backend: Railway (vote-main-production.up.railway.app)
// Uses session cookies + CSRF tokens for authentication

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://vote-main-production.up.railway.app/api/v1";

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
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

  async request<T>(
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
        credentials: 'include', // Include session cookies
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          error: data.error?.message || data.error || `HTTP ${res.status}`,
        };
      }

      return { data: data.data || data };
    } catch (error: any) {
      console.error(`API Error [${endpoint}]:`, error);
      return {
        error: error.message || 'Network error',
      };
    }
  }

  // Auth
  async login(identifier: string, password: string, role: string = 'STUDENT') {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ userIdentifier: identifier, password, role }),
    });
  }

  async register(data: {
    email: string;
    username: string;
    fullName: string;
    mobileNumber: string;
    enrollmentNumber: string;
    password: string;
    confirmPassword: string;
    role: string;
  }) {
    return this.request('/auth/register/instant', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendLoginOtp(email: string, role: string = 'STUDENT') {
    return this.request('/auth/otp/send-login', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }

  async verifyOtp(email: string, otp: string, role: string = 'STUDENT') {
    return this.request('/auth/otp/verify-login', {
      method: 'POST',
      body: JSON.stringify({ email, otp, role }),
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // Elections
  async getActiveElections() {
    return this.request('/elections/active');
  }

  async getElection(id: number) {
    return this.request(`/elections/${id}`);
  }

  // Positions & Candidates
  async getPositions(electionId?: number) {
    const endpoint = electionId ? `/positions?electionId=${electionId}` : '/positions';
    return this.request(endpoint);
  }

  async getCandidates(positionId?: number) {
    const endpoint = positionId ? `/positions/${positionId}/candidates` : '/candidates';
    return this.request(endpoint);
  }

  async getCandidate(id: number) {
    return this.request(`/candidates/${id}`);
  }

  // Voting
  async getAuthorization() {
    return this.request('/students/authorization');
  }

  async castVote(electionId: number, votes: { positionId: number; candidateId: number }[]) {
    return this.request('/votes', {
      method: 'POST',
      body: JSON.stringify({ electionId, votes }),
    });
  }

  async getReceipt(voteId: number) {
    return this.request(`/receipts/${voteId}`);
  }

  // Results
  async getResults(electionId?: number) {
    const endpoint = electionId ? `/results?electionId=${electionId}` : '/results';
    return this.request(endpoint);
  }

  // Student Profile
  async getProfile() {
    return this.request('/students/me');
  }

  async updateProfile(data: any) {
    return this.request('/students/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Notifications
  async getNotifications() {
    return this.request('/notifications');
  }

  // Announcements
  async getAnnouncements() {
    return this.request('/announcements');
  }

  // Clubs
  async getClubs() {
    return this.request('/clubs');
  }

  // Admin endpoints
  async getAdminDashboard() {
    return this.request('/admin/dashboard');
  }

  async getAdminStudents() {
    return this.request('/admin/students');
  }

  async getAdminElections() {
    return this.request('/admin/elections');
  }

  async getAdminCandidates() {
    return this.request('/admin/candidates');
  }

  async getAdminPositions() {
    return this.request('/admin/positions');
  }

  async getAdminClubs() {
    return this.request('/admin/clubs');
  }

  async getAdminAnnouncements() {
    return this.request('/admin/announcements');
  }

  async getAdminReports() {
    return this.request('/admin/reports');
  }

  async getAdminResults() {
    return this.request('/admin/results');
  }
}

export const api = new ApiClient();
export default api;
