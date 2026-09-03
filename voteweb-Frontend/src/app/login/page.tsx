"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HelpCircle, BookOpen, Mail, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { UserRole } from "@/lib/auth-types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://vote-main-production.up.railway.app/api/v1";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const getDashboardRoute = (role: UserRole): string => {
    switch (role) {
      case "student": return "/student/dashboard";
      case "candidate": return "/candidate/dashboard";
      case "administrator": return "/admin/dashboard";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);

    try {
      // Get CSRF token
      const csrfRes = await fetch(`${API_BASE}/auth/csrf`, {
        credentials: "include",
      });
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.data?.csrfToken || "";

      // Login via OTP flow - first send OTP
      const sendOtpRes = await fetch(`${API_BASE}/otp/send-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          userIdentifier: email,
          password: password,
          role: selectedRole.toUpperCase(),
        }),
      });

      const sendOtpData = await sendOtpRes.json();

      if (sendOtpRes.ok) {
        setSuccess(true);
        // Store email for OTP verification
        sessionStorage.setItem("loginEmail", email);
        sessionStorage.setItem("loginPassword", password);
        sessionStorage.setItem("loginRole", selectedRole);
        // Redirect to OTP verification
        setTimeout(() => {
          router.push("/verify-otp");
        }, 1500);
      } else {
        setError(sendOtpData.error?.message || sendOtpData.error || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <AuthCard>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">OTP Sent!</h2>
            <p className="text-gray-600 mb-4">Check your email for the verification code.</p>
            <p className="text-sm text-gray-500">Redirecting...</p>
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard className="space-y-6">
        <AuthHeader
          title="Welcome Back!"
          subtitle="Sign in to continue to Don Bosco Institute of Technology."
        />

        <RoleSelector
          selectedRole={selectedRole}
          onSelect={setSelectedRole}
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email / Username
            </label>
            <Input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email or username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-primary-600 hover:text-primary-700">
            Forgot Password?
          </Link>
          <Link href="/register" className="text-primary-600 hover:text-primary-700">
            Register
          </Link>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 justify-center text-xs text-gray-500">
            <Link href="/help" className="flex items-center gap-1 hover:text-primary-600">
              <HelpCircle className="w-3.5 h-3.5" />
              Help & Support
            </Link>
            <Link href="/student/guidelines" className="flex items-center gap-1 hover:text-primary-600">
              <BookOpen className="w-3.5 h-3.5" />
              Election Guidelines
            </Link>
            <Link href="/help" className="flex items-center gap-1 hover:text-primary-600">
              <Mail className="w-3.5 h-3.5" />
              Contact Administration
            </Link>
          </div>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
