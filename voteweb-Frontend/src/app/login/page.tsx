"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HelpCircle, BookOpen, Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { UserRole } from "@/lib/auth-types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://vote-main-production.up.railway.app/api/v1";

type LoginStep = "credentials" | "otp" | "success" | "locked";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const getDashboardRoute = (role: UserRole): string => {
    switch (role) {
      case "student": return "/student/dashboard";
      case "candidate": return "/candidate/dashboard";
      case "administrator": return "/admin/dashboard";
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDevOtp(null);

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (!password) {
      setError("Please enter your password");
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

      // Send login OTP
      const res = await fetch(`${API_BASE}/otp/send-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password: password,
          role: selectedRole.toUpperCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || data.error || "Failed to send OTP");
        setIsLoading(false);
        return;
      }

      // Check for dev OTP (in development mode)
      if (data.data?.devOtp) {
        setDevOtp(data.data.devOtp);
      }

      setStep("otp");
      setCooldown(30);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-submit when all digits filled
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    const fullOtp = newOtp.join("");
    if (fullOtp.length === 6 && /^\d+$/.test(fullOtp)) {
      handleVerifyOtp(fullOtp);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      handleVerifyOtp(pasted);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setOtp(["", "", "", "", "", ""]);
    setDevOtp(null);
    await handleSendOtp({ preventDefault: () => {} } as React.FormEvent);
  };

  const handleVerifyOtp = async (fullOtp?: string) => {
    setIsLoading(true);
    setError("");

    try {
      // Get CSRF token
      const csrfRes = await fetch(`${API_BASE}/auth/csrf`, {
        credentials: "include",
      });
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.data?.csrfToken || "";

      const otpToVerify = fullOtp || otp.join("");

      const res = await fetch(`${API_BASE}/otp/verify-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          otp: otpToVerify,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || data.error || "Invalid OTP");
        setIsLoading(false);
        return;
      }

      // Login successful - redirect to dashboard
      setStep("success");
      setTimeout(() => {
        router.push(getDashboardRoute(selectedRole));
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Step View
  const renderOtpStep = () => (
    <>
      <AuthHeader
        title="Enter Verification Code"
        subtitle={`We sent a 6-digit code to ${email}`}
      />

      {devOtp && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-yellow-800 text-xs font-medium">Development Mode - Your OTP:</p>
          <p className="text-yellow-900 text-lg font-bold font-mono tracking-widest">{devOtp}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        </div>
      )}

      <div className="flex justify-center gap-2 mb-6" onPaste={handleOtpPaste}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { otpRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(index, e)}
            className="w-12 h-14 text-center text-2xl font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            disabled={isLoading}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="primary"
        className="w-full mb-4"
        onClick={() => handleVerifyOtp()}
        disabled={isLoading || otp.join("").length < 6}
      >
        {isLoading ? "Verifying..." : "Verify & Login"}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => {
            setStep("credentials");
            setOtp(["", "", "", "", "", ""]);
            setError("");
          }}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          Back
        </button>

        <button
          type="button"
          onClick={handleResendOtp}
          disabled={cooldown > 0 || isLoading}
          className={`font-medium ${cooldown > 0 ? "text-gray-400" : "text-primary-600 hover:text-primary-700"}`}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
        </button>
      </div>
    </>
  );

  // Success Step View
  const renderSuccessStep = () => (
    <>
      <div className="flex flex-col items-center py-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <AuthHeader
          title="Login Successful!"
          subtitle="Redirecting to your dashboard..."
        />
      </div>
    </>
  );

  // Locked Account View
  const renderLockedStep = () => (
    <>
      <div className="flex flex-col items-center py-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <AuthHeader
          title="Account Locked"
          subtitle="Too many failed attempts. Please try again later."
        />
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => {
            setStep("credentials");
            setError("");
            setEmail("");
            setPassword("");
          }}
        >
          Try Again
        </Button>
      </div>
    </>
  );

  // Credentials Step View
  const renderCredentialsStep = () => (
    <>
      <AuthHeader
        title="Welcome Back!"
        subtitle="Sign in to continue to Don Bosco Institute of Technology."
      />

      <RoleSelector
        selectedRole={selectedRole}
        onSelect={setSelectedRole}
      />

      <form onSubmit={handleSendOtp} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Email Address
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Password
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-primary-600 hover:text-primary-700 font-medium">
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Sending Code..." : "Continue with OTP"}
        </Button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
          <p className="text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        </div>
      )}
    </>
  );

  return (
    <AuthLayout>
      <AuthCard>
        {step === "otp" && renderOtpStep()}
        {step === "success" && renderSuccessStep()}
        {step === "locked" && renderLockedStep()}
        {step === "credentials" && renderCredentialsStep()}

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
