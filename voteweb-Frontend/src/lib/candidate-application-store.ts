import type { ApplicationStatus } from "./candidate-dashboard-data";
import { candidateApi } from "./api/candidates";
import type { Candidate } from "./candidate-data";
import type { VotingPosition } from "./election-voting-data";

export interface CandidateApplicationData {
  id: string;
  name: string;
  enrollmentNumber: string;
  department: string;
  year: string;
  section: string;
  position: string;
  email: string;
  phone: string;
  photo: string | null;
  bio: string;
  manifesto: string;
  status: ApplicationStatus;
  rejectionReason: string | null;
  adminNote: string | null;
  submittedDate: string | null;
  reviewedDate: string | null;
}

export const POSITION_OPTIONS = [
  "President",
  "Vice President",
  "General Secretary",
  "Treasurer",
  "Cultural Secretary",
  "Sports Secretary",
];

export const DEPARTMENT_OPTIONS = ["BCA", "BBA", "BSc IT", "BSc CS", "B.Com", "BA"];

export const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export const SECTION_OPTIONS = ["A", "B", "C", "D", "E", "F"];

export async function getApplicationByEmail(email: string): Promise<CandidateApplicationData | undefined> {
  try {
    const all: any = await candidateApi.getAll();
    const apps = all?.data || all || [];
    if (Array.isArray(apps)) {
      return apps.find((a: any) => a.email?.toLowerCase() === email.toLowerCase());
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export async function getAllApplications(): Promise<CandidateApplicationData[]> {
  try {
    const all: any = await candidateApi.getAll();
    return all?.data || all || [];
  } catch {
    return [];
  }
}

export async function getApprovedCandidatesAsCandidateList(): Promise<Candidate[]> {
  try {
    const all: any = await candidateApi.getApproved();
    const apps = all?.data || all || [];
    return apps.map((app: any) => ({
      id: app.id || app.studentId,
      name: app.name,
      position: app.position,
      photo: app.photo,
      bio: app.bio,
      department: app.department,
      enrollmentNumber: app.enrollmentNumber,
    }));
  } catch {
    return [];
  }
}

export async function getApprovedCandidatesAsVotingPositions(): Promise<VotingPosition[]> {
  try {
    const all: any = await candidateApi.getApproved();
    const apps = all?.data || all || [];

    // Group by position
    const positions: Record<string, VotingPosition> = {};

    apps.forEach((app: any) => {
      const pos = app.position;
      if (!positions[pos]) {
        positions[pos] = {
          id: pos,
          name: pos,
          candidates: [],
        };
      }
      positions[pos].candidates.push({
        id: app.id || app.studentId,
        name: app.name,
        photo: app.photo,
        bio: app.bio,
        department: app.department,
        enrollmentNumber: app.enrollmentNumber,
      });
    });

    return Object.values(positions);
  } catch {
    return [];
  }
}

export async function submitApplication(
  data: Omit<CandidateApplicationData, "id" | "status" | "rejectionReason" | "adminNote" | "submittedDate" | "reviewedDate">
): Promise<CandidateApplicationData> {
  const result: any = await candidateApi.submit({
    name: data.name,
    enrollmentNumber: data.enrollmentNumber,
    department: data.department,
    year: data.year,
    section: data.section,
    position: data.position,
    email: data.email,
    phone: data.phone,
    photo: data.photo,
    bio: data.bio,
    manifesto: data.manifesto,
  });
  return result?.data || result;
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  rejectionReason?: string
): Promise<CandidateApplicationData> {
  const result: any = await candidateApi.updateStatus(id, { status, rejectionReason });
  return result?.data || result;
}

export async function deleteApplication(id: string): Promise<void> {
  await candidateApi.delete(id);
}
