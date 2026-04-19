"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams }               from "next/navigation";
import Link                              from "next/link";

function Logo() {
  return (
    <div className="text-center mb-8">
      <Link
        href="/"
        className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 shadow-lg mb-4 hover:opacity-90 hover:scale-[1.03] transition-all"
      >
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </Link>
      <h1 className="text-3xl font-bold text-gray-900">Nepal CRM</h1>
    </div>
  );
}

type TokenState = "checking" | "valid" | "invalid";

function ResetPasswordContent() {
  const searchParams            = useSearchParams();
  const token                   = searchParams.get("token") ?? "";
  const [tokenState, setTokenState] = useState<TokenState>("checking");
  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [done,       setDone]       = useState(false);

  // Validate the token as soon as the page loads — avoids the user filling out
  // the form only to be told the link is expired on submit.
  useEffect(() => {
    if (!token) {
      setTokenState("invalid");
      return;
    }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => setTokenState(d.valid ? "valid" : "invalid"))
      .catch(() => setTokenState("invalid"));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    const res  = await fetch("/api/auth/reset-password", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ token, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setSubmitting(false);
    } else {
      setDone(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <Logo />

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

          {/* ── Checking token ──────────────────────────── */}
          {tokenState === "checking" && (
            <div className="text-center py-4">
              <div className="flex justify-center mb-3">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
              </div>
              <p className="text-gray-500 text-sm">Validating reset link…</p>
            </div>
          )}

          {/* ── Invalid / expired token ──────────────────── */}
          {tokenState === "invalid" && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Link invalid or expired</h2>
              <p className="text-gray-500 text-sm mb-6">
                This reset link has either already been used or has expired (links are valid for 1 hour).
                Please request a new one.
              </p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition text-sm mb-3"
              >
                Request new reset link
              </Link>
              <Link href="/login" className="block text-sm text-primary-600 hover:underline text-center">
                Back to Sign In
              </Link>
            </div>
          )}

          {/* ── Success ──────────────────────────────────── */}
          {tokenState === "valid" && done && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Password updated!</h2>
              <p className="text-gray-500 text-sm mb-6">
                Your password has been changed. You can now sign in with your new password.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition text-sm"
              >
                Go to Sign In
              </Link>
            </div>
          )}

          {/* ── New password form ────────────────────────── */}
          {tokenState === "valid" && !done && (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Set new password</h2>
              <p className="text-sm text-gray-500 mb-6">Choose a new password for your account.</p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    New password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    placeholder="Minimum 6 characters"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    placeholder="Repeat new password"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold rounded-lg transition text-sm"
                >
                  {submitting ? "Updating…" : "Update Password"}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
