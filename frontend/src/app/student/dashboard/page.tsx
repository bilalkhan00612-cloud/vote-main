"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { User, BookOpen } from "lucide-react";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function StudentDashboardPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return <LoadingSkeleton />;

  return (
    <StudentLayout>
      {error && (
        <div className="max-w-7xl mx-auto w-full px-4 pt-6">
          <ErrorState
            title="Something went wrong"
            message={error}
            onRetry={() => setError(null)}
          />
        </div>
      )}
          <div className="max-w-7xl mx-auto w-full space-y-6">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                  Hello, Anurag!
                </h1>
                <p className="text-sm text-text-secondary">
                  Welcome back to CampusVote.
                </p>
              </div>
              <div className="text-xs font-bold text-text-muted bg-primary-50 border border-primary-100 px-3 py-1.5 rounded-xl w-fit">
                IP Secured &bull; Session Active
              </div>
            </div>

            {/* Election Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-[#1C1F33] rounded-2xl p-5 border border-border shadow-sm">
                <h2 className="text-lg font-semibold text-text-primary">Student Council Election 2026</h2>
                <p className="text-sm text-text-secondary mt-1">
                  Voting period: 1 August &ndash; 10 August 2026 &bull; 5:00 PM
                </p>
              </div>
              <div className="rounded-2xl bg-primary-50 text-center p-6 border border-primary-100">
                <span className="text-3xl font-bold text-primary-600">3,000</span>
                <span className="text-sm text-text-secondary ml-2">Eligible Voters</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Link href="/student/vote">
                <div className="p-4 rounded-xl bg-white dark:bg-[#1C1F33] border border-border hover:bg-primary-50 hover:border-primary-200 cursor-pointer transition-colors shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center mb-3">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <h4 className="font-medium text-text-primary">Vote</h4>
                  <p className="text-xs text-text-secondary">Cast your vote</p>
                </div>
              </Link>
              <Link href="/student/candidates">
                <div className="p-4 rounded-xl bg-white dark:bg-[#1C1F33] border border-border hover:bg-primary-50 hover:border-primary-200 cursor-pointer transition-colors shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center mb-3">
                    <BookOpen className="w-5 h-5 text-primary-600" />
                  </div>
                  <h4 className="font-medium text-text-primary">Candidates</h4>
                  <p className="text-xs text-text-secondary">View candidates</p>
                </div>
              </Link>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-[#1C1F33] rounded-2xl p-4 border border-border shadow-sm">
              <p className="text-sm text-text-secondary">No recent activity</p>
            </div>
          </div>
    </StudentLayout>
  );
}
