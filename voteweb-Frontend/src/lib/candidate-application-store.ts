import type { ApplicationStatus } from "./candidate-dashboard-data";
import type { Candidate } from "./candidate-data";
import type { VotingCandidate, VotingPosition } from "./election-voting-data";
import { candidateApi } from "./api/candidates";

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

export const SECTION_OPTIONS = ["A", "B", "C", "D"];

export async function getApplication(candidateId: string): Promise<CandidateApplicationData | undefined> {
  try {
    return await candidateApi.getApplication(candidateId);
  } catch {
    return undefined;
  }
}

export async function getApplicationByEmail(email: string): Promise<CandidateApplicationData | undefined> {
  try {
    const all = await candidateApi.getAll();
    return all.find((a: CandidateApplicationData) => a.email.toLowerCase() === email.toLowerCase());
  } catch {
    return undefined;
  }
}

export async function getAllApplications(): Promise<CandidateApplicationData[]> {
  return candidateApi.getAll();
}

export async function submitApplication(
  data: Omit<CandidateApplicationData, "id" | "status" | "rejectionReason" | "adminNote" | "submittedDate" | "reviewedDate">
): Promise<CandidateApplicationData> {
  return candidateApi.submit({
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
}

export async function updateApplicationStatus(
  candidateId: string,
  status: ApplicationStatus,
  reason?: string,
  note?: string
): Promise<CandidateApplicationData | undefined> {
  try {
    return await candidateApi.updateStatus(candidateId, { status, reason, note });
  } catch {
    return undefined;
  }
}

export function getDashboardRoute(_candidateId: string): string {
  return "/candidate/dashboard";
}

export async function getApprovedCandidates(): Promise<CandidateApplicationData[]> {
  return candidateApi.getApproved();
}

export async function getApprovedCandidatesAsCandidateList(): Promise<Candidate[]> {
  const approved = await getApprovedCandidates();
  return approved.map((app) => ({
    id: app.id,
    name: app.name,
    position: app.position as Candidate["position"],
    department: app.department as Candidate["department"],
    year: app.year as Candidate["year"],
    photoInitials: app.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
    campaignSymbol: app.position.slice(0, 3).toUpperCase(),
    verified: true,
    biography: app.bio,
    manifestos: parseManifesto(app.manifesto),
  }));
}

export async function getApprovedCandidatesAsVotingPositions(): Promise<VotingPosition[]> {
  const approved = await getApprovedCandidates();
  const positionMap = new Map<string, VotingCandidate[]>();

  for (const app of approved) {
    const candidate: VotingCandidate = {
      id: app.id,
      name: app.name,
      department: app.department,
      year: app.year,
      photoInitials: app.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
      campaignSymbol: app.position.slice(0, 3).toUpperCase(),
      shortManifesto: app.bio,
    };
    const existing = positionMap.get(app.position) || [];
    existing.push(candidate);
    positionMap.set(app.position, existing);
  }

  const positions: VotingPosition[] = [];
  let order = 1;
  for (const [name, candidates] of positionMap) {
    positions.push({ id: `pos-${order}`, name, order, candidates });
    order++;
  }
  return positions;
}

function parseManifesto(json: string): { id: string; title: string; content: string }[] {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed.map((s: { title?: string; content?: string }, i: number) => ({
        id: String(i + 1),
        title: s.title || "Manifesto",
        content: s.content || "",
      }));
    }
  } catch { /* ignore */ }
  return [{ id: "1", title: "Manifesto", content: json }];
}
