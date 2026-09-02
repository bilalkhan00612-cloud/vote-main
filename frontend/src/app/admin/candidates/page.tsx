"use client"

import { AdminLayout } from "@/components/admin-dashboard/AdminLayout"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { MOCK_ADMIN_CANDIDATES, CANDIDATE_STATUS_MAP } from "@/lib/admin-dashboard-data"
import {
  updateApplicationStatus,
  getAllApplications,
  type CandidateApplicationData,
} from "@/lib/candidate-application-store"
import {
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  X,
  FileText,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  BookOpen,
  MessageSquare,
} from "lucide-react"
import { useState, useMemo } from "react"

export default function CandidateManagementPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [positionFilter, setPositionFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null)
  const [showPanel, setShowPanel] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showChangesModal, setShowChangesModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [changesReason, setChangesReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const statuses = ["all", "draft", "submitted", "under_review", "changes_requested", "approved", "rejected"]
  const departments = ["all", "BCA", "BBA", "BSc IT"]

  const candidates = useMemo(() => {
    const storeApps = getAllApplications();
    const merged = MOCK_ADMIN_CANDIDATES.map((mc) => {
      const app = storeApps.find((a) => a.id === mc.id);
      if (app) {
        return {
          ...mc,
          applicationStatus: app.status,
          rejectionReason: app.rejectionReason,
          adminNote: app.adminNote,
          enrollmentNumber: app.enrollmentNumber,
          section: app.section,
          email: app.email,
          phone: app.phone,
          photo: app.photo,
          manifesto: app.manifesto,
          bio: app.bio,
        };
      }
      return mc;
    });
    const newApps = storeApps
      .filter((a) => !MOCK_ADMIN_CANDIDATES.some((mc) => mc.id === a.id))
      .map((a) => ({
        ...a,
        applicationStatus: a.status,
        profileStatus: "Pending",
        submittedDate: a.submittedDate || "—",
      }));
    return [...merged, ...newApps];
  }, [])

  const positions = useMemo(() => {
    const posSet = new Set(candidates.map((c) => c.position));
    return ["all", ...Array.from(posSet)];
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchesSearch =
        searchQuery === "" ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.enrollmentNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPosition = positionFilter === "all" || c.position === positionFilter;
      const matchesStatus = statusFilter === "all" || c.applicationStatus === statusFilter;
      const matchesDepartment = departmentFilter === "all" || c.department === departmentFilter;
      return matchesSearch && matchesPosition && matchesStatus && matchesDepartment;
    });
  }, [candidates, searchQuery, positionFilter, statusFilter, departmentFilter]);

  const openReview = (candidate: any) => {
    setSelectedCandidate(candidate);
    setShowPanel(true);
  };

  const closeReview = () => {
    setShowPanel(false);
    setSelectedCandidate(null);
    setShowApproveModal(false);
    setShowRejectModal(false);
    setShowChangesModal(false);
    setRejectReason("");
    setChangesReason("");
  };

  const handleApprove = async () => {
    if (!selectedCandidate) return;
    setIsLoading(true);
    try {
      await updateApplicationStatus(selectedCandidate.id, "approved");
      setSelectedCandidate({ ...selectedCandidate, applicationStatus: "approved" });
      setShowApproveModal(false);
    } catch (error) {
      console.error("Failed to approve:", error);
    }
    setIsLoading(false);
  };

  const handleReject = async () => {
    if (!selectedCandidate || !rejectReason.trim()) return;
    setIsLoading(true);
    try {
      await updateApplicationStatus(selectedCandidate.id, "rejected", rejectReason);
      setSelectedCandidate({ ...selectedCandidate, applicationStatus: "rejected", rejectionReason });
      setShowRejectModal(false);
      setRejectReason("");
    } catch (error) {
      console.error("Failed to reject:", error);
    }
    setIsLoading(false);
  };

  const handleRequestChanges = async () => {
    if (!selectedCandidate || !changesReason.trim()) return;
    setIsLoading(true);
    try {
      await updateApplicationStatus(selectedCandidate.id, "changes_requested", changesReason);
      setSelectedCandidate({ ...selectedCandidate, applicationStatus: "changes_requested", adminNote: changesReason });
      setShowChangesModal(false);
      setChangesReason("");
    } catch (error) {
      console.error("Failed to request changes:", error);
    }
    setIsLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "under_review":
      case "submitted":
        return "warning";
      case "changes_requested":
        return "info";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    return CANDIDATE_STATUS_MAP[status]?.label || status;
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Candidate Applications</h1>
          <p className="text-text-secondary mt-1">Review and manage candidate applications</p>
        </div>

        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, ID, or enrollment number..."
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="relative">
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="appearance-none bg-white dark:bg-[#1C1F33] border border-border rounded-lg px-4 py-2 pr-8 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {positions.map((p) => (
                  <option key={p} value={p}>
                    {p === "all" ? "All Positions" : p}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white dark:bg-[#1C1F33] border border-border rounded-lg px-4 py-2 pr-8 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s === "all" ? "All Statuses" : CANDIDATE_STATUS_MAP[s]?.label || s}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="appearance-none bg-white dark:bg-[#1C1F33] border border-border rounded-lg px-4 py-2 pr-8 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d === "all" ? "All Departments" : d}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
            </div>
          </div>
        </Card>

        <Card>
          {filteredCandidates.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary">No Candidate Applications</h3>
              <p className="text-text-secondary mt-1">No candidates match the current filters.</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">ID</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Candidate</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Position</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Department</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Submitted</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCandidates.map((candidate) => (
                      <tr key={candidate.id} className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 text-sm font-mono text-text-secondary">{candidate.id}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-text-primary">{candidate.name}</div>
                          <div className="text-xs text-text-muted">{candidate.enrollmentNumber}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{candidate.position}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{candidate.department}</td>
                        <td className="px-4 py-3">
                          <Badge variant={getStatusBadge(candidate.applicationStatus)}>
                            {getStatusLabel(candidate.applicationStatus)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{candidate.submittedDate}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="outline" size="sm" onClick={() => openReview(candidate)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-border">
                {filteredCandidates.map((candidate) => (
                  <div key={candidate.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-text-primary">{candidate.name}</div>
                      <Button variant="outline" size="sm" onClick={() => openReview(candidate)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </div>
                    <div className="text-sm text-text-secondary font-mono">{candidate.id}</div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-text-secondary">{candidate.position}</span>
                      <span className="text-text-muted">·</span>
                      <span className="text-sm text-text-secondary">{candidate.department}</span>
                      <span className="text-text-muted">·</span>
                      <Badge variant={getStatusBadge(candidate.applicationStatus)} className="text-xs">
                        {getStatusLabel(candidate.applicationStatus)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* =====================================================
          CANDIDATE REVIEW MODAL - Large Centered Card
          ===================================================== */}
      {showPanel && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Dark Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={closeReview} />

          {/* Modal Card */}
          <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* ================================
                MODAL HEADER
                ================================ */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">Candidate Review</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-medium text-text-primary">{selectedCandidate.name}</span>
                      <span className="text-text-muted">·</span>
                      <Badge variant={getStatusBadge(selectedCandidate.applicationStatus)}>
                        {getStatusLabel(selectedCandidate.applicationStatus)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeReview}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="h-5 w-5 text-text-muted" />
                </button>
              </div>
            </div>

            {/* ================================
                MODAL CONTENT (Scrollable)
                ================================ */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Candidate Information Section */}
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-text-secondary uppercase tracking-wide">
                    <User className="h-4 w-4" />
                    Candidate Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs text-text-muted">Enrollment Number</label>
                      <p className="text-sm font-medium text-text-primary">{selectedCandidate.enrollmentNumber || "—"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-text-muted">Position</label>
                      <p className="text-sm font-medium text-text-primary">{selectedCandidate.position}</p>
                    </div>
                    <div>
                      <label className="text-xs text-text-muted">Department</label>
                      <p className="text-sm font-medium text-text-primary">{selectedCandidate.department}</p>
                    </div>
                    <div>
                      <label className="text-xs text-text-muted">Year</label>
                      <p className="text-sm font-medium text-text-primary">{selectedCandidate.year || "—"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-text-muted">Section</label>
                      <p className="text-sm font-medium text-text-primary">{selectedCandidate.section || "—"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-text-muted">Semester</label>
                      <p className="text-sm font-medium text-text-primary">{selectedCandidate.semester || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-text-secondary uppercase tracking-wide">
                    <Mail className="h-4 w-4" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-text-muted">Email</label>
                      <p className="text-sm font-medium text-text-primary">{selectedCandidate.email || "—"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-text-muted">Phone</label>
                      <p className="text-sm font-medium text-text-primary">{selectedCandidate.phone || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Biography */}
                {selectedCandidate.bio && (
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-text-secondary uppercase tracking-wide">
                      <FileText className="h-4 w-4" />
                      Biography
                    </h3>
                    <div className="bg-gray-50 border border-border rounded-lg p-4">
                      <p className="text-sm text-text-primary whitespace-pre-wrap">{selectedCandidate.bio}</p>
                    </div>
                  </div>
                )}

                {/* Campaign Manifesto */}
                {selectedCandidate.manifesto && (
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-text-secondary uppercase tracking-wide">
                      <BookOpen className="h-4 w-4" />
                      Campaign Manifesto
                    </h3>
                    <div className="bg-gray-50 border border-border rounded-lg p-4">
                      <p className="text-sm text-text-primary whitespace-pre-wrap">{selectedCandidate.manifesto}</p>
                    </div>
                  </div>
                )}

                {/* Submission Info */}
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-text-secondary uppercase tracking-wide">
                    <Calendar className="h-4 w-4" />
                    Submission
                  </h3>
                  <p className="text-sm text-text-primary">
                    Submitted: {selectedCandidate.submittedDate || "Not yet submitted"}
                  </p>
                </div>

                {/* Rejection Reason */}
                {selectedCandidate.rejectionReason && (
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-error-600 uppercase tracking-wide">
                      <XCircle className="h-4 w-4" />
                      Rejection Reason
                    </h3>
                    <div className="bg-error-50 border border-error-100 rounded-lg p-4">
                      <p className="text-sm text-error-700">{selectedCandidate.rejectionReason}</p>
                    </div>
                  </div>
                )}

                {/* Admin Note */}
                {selectedCandidate.adminNote && (
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-warning-600 uppercase tracking-wide">
                      <MessageSquare className="h-4 w-4" />
                      Admin Note
                    </h3>
                    <div className="bg-warning-50 border border-warning-100 rounded-lg p-4">
                      <p className="text-sm text-warning-700">{selectedCandidate.adminNote}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ================================
                MODAL ACTIONS (Fixed at Bottom)
                ================================ */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-gray-50/50">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Approve - Primary Action */}
                <Button
                  onClick={() => setShowApproveModal(true)}
                  className="flex-1 bg-success-600 hover:bg-success-700 text-white h-12 text-base font-semibold"
                  disabled={selectedCandidate.applicationStatus === "approved" || selectedCandidate.applicationStatus === "rejected"}
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Approve Candidate
                </Button>

                {/* Request Changes - Secondary Action */}
                <Button
                  onClick={() => setShowChangesModal(true)}
                  variant="outline"
                  className="flex-1 h-12 text-base font-semibold"
                  disabled={selectedCandidate.applicationStatus === "approved" || selectedCandidate.applicationStatus === "rejected"}
                >
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Request Changes
                </Button>

                {/* Reject - Destructive Action */}
                <Button
                  onClick={() => setShowRejectModal(true)}
                  variant="danger"
                  className="flex-1 h-12 text-base font-semibold"
                  disabled={selectedCandidate.applicationStatus === "approved" || selectedCandidate.applicationStatus === "rejected"}
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Reject Candidate
                </Button>
              </div>

              {/* Close Button */}
              <div className="mt-3">
                <Button onClick={closeReview} variant="outline" className="w-full h-10">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================
          APPROVE CONFIRMATION MODAL
          ================================ */}
      {showApproveModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowApproveModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Approve Candidate?</h3>
                <p className="text-sm text-text-secondary">This candidate will gain access to the candidate dashboard.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowApproveModal(false)}>
                Cancel
              </Button>
              <Button
                className="bg-success-600 hover:bg-success-700 text-white"
                onClick={handleApprove}
                disabled={isLoading}
              >
                {isLoading ? "Approving..." : "Approve"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================================
          REJECT CONFIRMATION MODAL
          ================================ */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRejectModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-error-100 rounded-full flex items-center justify-center">
                <XCircle className="h-6 w-6 text-error-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Reject Candidate?</h3>
                <p className="text-sm text-text-secondary">Please provide a reason for rejection.</p>
              </div>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Provide a reason for rejection..."
              rows={4}
              className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-error-500 resize-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={!rejectReason.trim() || isLoading}
                onClick={handleReject}
              >
                {isLoading ? "Rejecting..." : "Reject Application"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================================
          REQUEST CHANGES MODAL
          ================================ */}
      {showChangesModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowChangesModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-warning-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Request Changes?</h3>
                <p className="text-sm text-text-secondary">Describe the changes needed from the candidate.</p>
              </div>
            </div>
            <textarea
              value={changesReason}
              onChange={(e) => setChangesReason(e.target.value)}
              placeholder="Describe what changes are needed..."
              rows={4}
              className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warning-500 resize-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowChangesModal(false)}>
                Cancel
              </Button>
              <Button
                variant="warning"
                disabled={!changesReason.trim() || isLoading}
                onClick={handleRequestChanges}
              >
                {isLoading ? "Sending..." : "Request Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
