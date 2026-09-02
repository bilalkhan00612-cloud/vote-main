/**
 * Candidate Application API Client
 * Connects frontend to backend candidate application endpoints
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  application?: any;
  applications?: any[];
  access?: {
    status: string;
    isApproved: boolean;
    canAccessCandidatePortal: boolean;
  };
}

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  const data = await response.json();
  return { status: response.status, ...data };
}

/**
 * Submit a candidate application
 */
export async function submitApplication(formData: {
  fullName: string;
  enrollmentNumber: string;
  department: string;
  year: string;
  semester?: string;
  section?: string;
  positionId: number;
  email: string;
  phone: string;
  profilePhoto?: string;
  bio: string;
  manifesto: string;
}): Promise<ApiResponse<any>> {
  return fetchApi('/api/candidates/apply', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
}

/**
 * Get current user's application
 */
export async function getMyApplication(): Promise<ApiResponse<any>> {
  return fetchApi('/api/candidates/me/application');
}

/**
 * Check candidate portal access
 */
export async function checkCandidateAccess(): Promise<ApiResponse<any>> {
  return fetchApi('/api/candidates/me/access');
}

/**
 * Update profile (photo, bio, manifesto) after approval
 */
export async function updateMyProfile(data: {
  profilePhotoUrl?: string;
  bio?: string;
  manifesto?: string;
}): Promise<ApiResponse<any>> {
  return fetchApi('/api/candidates/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Resubmit application after changes requested
 */
export async function resubmitApplication(data: {
  fullName?: string;
  enrollmentNumber?: string;
  department?: string;
  year?: string;
  semester?: string;
  section?: string;
  positionId?: number;
  email?: string;
  phone?: string;
  profilePhotoUrl?: string;
  bio?: string;
  manifesto?: string;
}): Promise<ApiResponse<any>> {
  return fetchApi('/api/candidates/me/resubmit', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Admin API functions
export async function getAdminApplications(params?: {
  search?: string;
  status?: string;
  department?: string;
  positionId?: string;
}): Promise<ApiResponse<any>> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.department) searchParams.set('department', params.department);
  if (params?.positionId) searchParams.set('positionId', params.positionId);

  const query = searchParams.toString();
  return fetchApi(`/api/admin/candidate-applications${query ? `?${query}` : ''}`);
}

export async function getAdminApplication(id: number): Promise<ApiResponse<any>> {
  return fetchApi(`/api/admin/candidate-applications/${id}`);
}

export async function approveApplication(id: number): Promise<ApiResponse<any>> {
  return fetchApi(`/api/admin/candidate-applications/${id}/approve`, {
    method: 'PATCH',
  });
}

export async function rejectApplication(id: number, reason: string): Promise<ApiResponse<any>> {
  return fetchApi(`/api/admin/candidate-applications/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

export async function requestChanges(id: number, reason: string): Promise<ApiResponse<any>> {
  return fetchApi(`/api/admin/candidate-applications/${id}/request-changes`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}
