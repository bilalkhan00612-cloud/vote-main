import type { ApplicationStatus } from "./candidate-dashboard-data";
import type { Candidate, CandidatePosition, CandidateDepartment, CandidateYear, ManifestoSection } from "./candidate-data";
import type { VotingCandidate, VotingPosition } from "./election-voting-data";

export interface CandidateApplicationData {
  id: string;
  name: string;
  enrollmentNumber: string;
  department: string;
  year: string;
  semester?: string;
  section?: string;
  positionId: number;
  positionName?: string;
  email: string;
  phone: string;
  profilePhotoUrl: string | null;
  bio: string;
  manifesto: string;
  status: ApplicationStatus;
  rejectionReason: string | null;
  changesRequestedReason: string | null;
  submittedDate: string | null;
  reviewedDate: string | null;
}

// ============================================
// OPTIONS (for form dropdowns)
// ============================================
const POSITION_OPTIONS = [
  "President",
  "Vice President",
  "General Secretary",
  "Treasurer",
  "Cultural Secretary",
  "Sports Secretary",
];

const DEPARTMENT_OPTIONS = ["BCA", "BBA", "BSc IT", "BSc CS", "B.Com", "BA"];

const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

const SECTION_OPTIONS = ["A", "B", "C", "D"];

// ============================================
// API Client
// ============================================
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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

// ============================================
// API Functions (Real Backend Integration)
// ============================================

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
  profilePhotoUrl?: string;
  bio: string;
  manifesto: string;
}): Promise<{ success: boolean; application?: CandidateApplicationData; message?: string }> {
  const response = await fetchApi('/api/candidates/apply', {
    method: 'POST',
    body: JSON.stringify(formData),
  });

  if (response.success && response.application) {
    return {
      success: true,
      application: response.application,
    };
  }

  return {
    success: false,
    message: response.message || 'Failed to submit application',
  };
}

export async function getMyApplication(): Promise<{ success: boolean; application?: CandidateApplicationData; message?: string }> {
  const response = await fetchApi('/api/candidates/me/application');

  if (response.success && response.application) {
    return {
      success: true,
      application: response.application,
    };
  }

  return {
    success: false,
    message: response.message || 'Failed to get application',
  };
}

export async function checkCandidateAccess(): Promise<{
  success: boolean;
  status?: ApplicationStatus;
  isApproved?: boolean;
  canAccessCandidatePortal?: boolean;
  message?: string;
}> {
  const response = await fetchApi('/api/candidates/me/access');

  if (response.success && response.access) {
    return {
      success: true,
      status: response.access.status,
      isApproved: response.access.isApproved,
      canAccessCandidatePortal: response.access.canAccessCandidatePortal,
    };
  }

  return {
    success: false,
    message: response.message || 'Failed to check access',
  };
}

export async function updateMyProfile(data: {
  profilePhotoUrl?: string;
  bio?: string;
  manifesto?: string;
}): Promise<{ success: boolean; application?: CandidateApplicationData; message?: string }> {
  const response = await fetchApi('/api/candidates/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (response.success && response.application) {
    return {
      success: true,
      application: response.application,
    };
  }

  return {
    success: false,
    message: response.message || 'Failed to update profile',
  };
}

export async function resubmitApplication(formData: {
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
}): Promise<{ success: boolean; application?: CandidateApplicationData; message?: string }> {
  const response = await fetchApi('/api/candidates/me/resubmit', {
    method: 'POST',
    body: JSON.stringify(formData),
  });

  if (response.success && response.application) {
    return {
      success: true,
      application: response.application,
    };
  }

  return {
    success: false,
    message: response.message || 'Failed to resubmit application',
  };
}

// ============================================
// Admin API Functions
// ============================================

export async function getAdminCandidates(filters?: {
  search?: string;
  status?: string;
  department?: string;
  position?: string;
}): Promise<{ success: boolean; applications?: CandidateApplicationData[]; message?: string }> {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.department) params.append('department', filters.department);
  if (filters?.position) params.append('position', filters.position);

  const queryString = params.toString();
  const endpoint = queryString ? `/api/admin/candidate-applications?${queryString}` : '/api/admin/candidate-applications';

  const response = await fetchApi(endpoint);

  if (response.success && response.applications) {
    return {
      success: true,
      applications: response.applications,
    };
  }

  return {
    success: false,
    message: response.message || 'Failed to get applications',
  };
}

export async function getAdminCandidate(id: number): Promise<{ success: boolean; application?: CandidateApplicationData; message?: string }> {
  const response = await fetchApi(`/api/admin/candidate-applications/${id}`);

  if (response.success && response.application) {
    return {
      success: true,
      application: response.application,
    };
  }

  return {
    success: false,
    message: response.message || 'Failed to get application',
  };
}

export async function approveApplication(id: number): Promise<{ success: boolean; application?: CandidateApplicationData; message?: string }> {
  const response = await fetchApi(`/api/admin/candidate-applications/${id}/approve`, {
    method: 'PATCH',
  });

  if (response.success && response.application) {
    return {
      success: true,
      application: response.application,
    };
  }

  return {
    success: false,
    message: response.message || 'Failed to approve application',
  };
}

export async function rejectApplication(id: number, reason: string): Promise<{ success: boolean; application?: CandidateApplicationData; message?: string }> {
  const response = await fetchApi(`/api/admin/candidate-applications/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });

  if (response.success && response.application) {
    return {
      success: true,
      application: response.application,
    };
  }

  return {
    success: false,
    message: response.message || 'Failed to reject application',
  };
}

export async function requestChangesApplication(id: number, reason: string): Promise<{ success: boolean; application?: CandidateApplicationData; message?: string }> {
  const response = await fetchApi(`/api/admin/candidate-applications/${id}/request-changes`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });

  if (response.success && response.application) {
    return {
      success: true,
      application: response.application,
    };
  }

  return {
    success: false,
    message: response.message || 'Failed to request changes',
  };
}

// ============================================
// Mock Data (for development/testing)
// ============================================
export const MOCK_APPLICATIONS: CandidateApplicationData[] = [];

export const MOCK_CANDIDATE_PROFILE: CandidateApplicationData = {
  id: "APP-001",
  name: "Sample Candidate",
  enrollmentNumber: "DBIT2025001",
  department: "BCA",
  year: "2nd Year",
  semester: "4",
  section: "A",
  positionId: 1,
  positionName: "President",
  email: "candidate@example.com",
  phone: "9876543210",
  profilePhotoUrl: null,
  bio: "Passionate about student welfare and campus development.",
  manifesto: "I will work towards improving campus facilities and organizing more cultural events.",
  status: "under_review",
  rejectionReason: null,
  changesRequestedReason: null,
  submittedDate: new Date().toISOString(),
  reviewedDate: null,
};

function toMockApplication(app: CandidateApplicationData): any {
  return {
    ...app,
    name: app.name || app.fullName || app.department || "Unknown",
    photo: app.profilePhotoUrl,
    applicationStatus: app.status,
    adminNote: app.changesRequestedReason || app.rejectionReason,
    submittedDate: app.submittedDate,
    reviewedDate: app.reviewedDate,
  };
}

export function getApplicationsByPosition(applications: CandidateApplicationData[]): VotingPosition[] {
  const positionMap = new Map<string, any[]>();

  for (const app of applications) {
    const positionName = app.positionName || POSITION_OPTIONS[0];
    const candidate = {
      id: app.id,
      name: app.name,
      position: positionName,
      department: app.department,
      year: app.year,
      photoInitials: (app.name || 'U').substring(0, 2).toUpperCase(),
      campaignSymbol: positionName.slice(0, 3).toUpperCase(),
      shortManifesto: app.bio,
    };
    const existing = positionMap.get(positionName) || [];
    existing.push(candidate);
    positionMap.set(positionName, existing);
  }

  const positions: VotingPosition[] = [];
  let order = 1;
  for (const [name, candidates] of positionMap) {
    positions.push({ id: `pos-${order}`, name, order, candidates });
    order++;
  }
  return positions;
}

function parseManifesto(json: string): ManifestoSection[] {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed.map((s: { title?: string; content?: string }) => ({
        title: s.title || "Manifesto",
        content: s.content || "",
      }));
    }
  } catch { /* ignore */ }
  return [{ title: "Manifesto", content: json }];
}

export { POSITION_OPTIONS, DEPARTMENT_OPTIONS, YEAR_OPTIONS, SECTION_OPTIONS };
