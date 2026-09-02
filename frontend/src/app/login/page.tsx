"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HelpCircle, BookOpen, Mail, ArrowRight } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { RememberMe } from "@/components/auth/RememberMe";
import { ErrorMessage } from "@/components/auth/ErrorMessage";
import { SuccessState } from "@/components/auth/SuccessState";
import { AuthNotice } from "@/components/auth/AuthNotice";
import { LockedAccountState } from "@/components/auth/LockedAccountState";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { UserRole, ValidationErrors } from "@/lib/auth-types";
import {
  authenticate,
  validateEmail,
  validatePassword,
  isAccountLocked,
  getDashboardRoute,
  setAuthCookie,
} from "@/lib/mock-auth";

type LoginPageState = "form" | "loading" | "success" | "locked";

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [pageState, setPageState] = useState<LoginPageState>("form");
  const [isPending, setIsPending] = useState(false);

  const getTitle = useCallback((role: UserRole): string => {
    switch (role) {
      case "student":
        return "Student Login";
      case "candidate":
        return "Candidate Login";
      case "administrator":
        return "Administrator Login";
    }
  }, []);

  const getIdentifierLabel = useCallback((role: UserRole): string => {
    switch (role) {
      case "student":
        return "College Email / Student ID";
      case "candidate":
        return "Candidate ID / College Email";
      case "administrator":
        return "Admin Email";
    }
  }, []);

  const getButtonLabel = useCallback((role: UserRole): string => {
    switch (role) {
      case "student":
        return "Login";
      case "candidate":
        return "Login as Candidate";
      case "administrator":
        return "Login as Admin";
    }
  }, []);

  const getHelperText = useCallback((role: UserRole): string | null => {
    switch (role) {
      case "student":
        return "Sign in using your official college credentials.";
      case "candidate":
        return "Candidate accounts are created and verified by election administration.";
      case "administrator":
        return "Administrator access is restricted to authorized election administrators.";
    }
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    const emailError = validateEmail(email, selectedRole);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password, selectedRole]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (isPending || pageState !== "form") return;

      if (!validateForm()) return;

      if (isAccountLocked(email.toLowerCase().trim())) {
        setPageState("locked");
        return;
      }

      setIsPending(true);
      setPageState("loading");

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const result = authenticate(email, password, selectedRole);

      if (result.locked) {
        setPageState("locked");
        setIsPending(false);
        return;
      }

      if (!result.success) {
        setErrors({ general: result.error || "Something went wrong. Please try again." });
        setPageState("form");
        setIsPending(false);
        return;
      }

      setPageState("success");
      setAuthCookie(selectedRole, result.user?.name || "", email);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      router.push(getDashboardRoute(selectedRole));
    },
    [email, password, selectedRole, isPending, pageState, validateForm, router]
  );

  const handleRoleChange = useCallback((role: UserRole) => {
    setSelectedRole(role);
    setErrors({});
    setEmail("");
    setPassword("");
    setRememberMe(false);
    setPageState("form");
  }, []);

  if (pageState === "success") {
    return (
      <AuthLayout>
        <AuthCard>
          <SuccessState
            title="Login successful"
            message="Redirecting to your dashboard..."
          />
        </AuthCard>
      </AuthLayout>
    );
  }

  if (pageState === "locked") {
    return (
      <AuthLayout>
        <div className="space-y-4">
          <AuthHeader
            title="Welcome Back!"
            subtitle="Sign in to continue to Don Bosco Institute of Technology."
          />
          <LockedAccountState
            onTryAgain={() => {
              setPageState("form");
              setErrors({});
              setPassword("");
            }}
            onContactSupport={() => router.push("/help")}
          />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-5">
        <AuthHeader
          title="Welcome Back!"
          subtitle="Sign in to continue to CampusVote."
        />

        {/* Role Selection */}
        <RoleSelector
          selectedRole={selectedRole}
          onSelect={handleRoleChange}
        />

        {/* Login Form */}
        <AuthCard className="space-y-5">
          <h2 className="text-lg font-semibold text-text-primary">{getTitle(selectedRole)}</h2>

          {errors.general && <ErrorMessage message={errors.general} />}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label={getIdentifierLabel(selectedRole)}
              type="text"
              placeholder="you@college.edu"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                if (errors.general) setErrors((prev) => ({ ...prev, general: undefined }));
              }}
              error={errors.email}
              autoComplete="email"
              aria-required="true"
            />

            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                if (errors.general) setErrors((prev) => ({ ...prev, general: undefined }));
              }}
              error={errors.password}
              autoComplete="current-password"
              aria-required="true"
            />

            {/* Remember Me + Forgot Password */}
            <div className="flex items-center justify-between gap-3">
              {selectedRole === "student" ? (
                <RememberMe
                  label="Remember me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
              ) : (
                <span />
              )}
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              isLoading={pageState === "loading"}
              disabled={pageState === "loading" || isPending}
              className="w-full h-12 gap-2 rounded-xl"
              size="lg"
            >
              {pageState === "loading"
                ? "Signing in..."
                : (
                  <>
                    {getButtonLabel(selectedRole)}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
            </Button>
          </form>

          {getHelperText(selectedRole) && (
            <AuthNotice>{getHelperText(selectedRole)!}</AuthNotice>
          )}
        </AuthCard>

        {/* Help Section */}
        <div className="space-y-3 pt-1">
          <p className="text-xs font-medium text-text-muted text-center">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
              Create Account
            </Link>
          </p>
          <p className="text-xs font-medium text-text-muted text-center">
            Having trouble signing in?
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            <Link
              href="/help"
              className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Help &amp; Support
            </Link>
            <Link
              href="/student/guidelines"
              className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Election Guidelines
            </Link>
            <Link
              href="/help"
              className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              Contact Election Administration
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}