"use client";

import { useState }    from "react";
import Link            from "next/link";

// Shared logo block used on all auth pages
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

export default function ForgotPasswordPage() {
  const [email,    setEmail]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    await fetch("/api/auth/forgot-password", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: email.trim() }),
    });

    // Always show the same confirmation — never reveal whether the email exists
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <Logo />

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {submitted ? (
            /* ── Confirmation screen ─────────────────────── */
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h2>
              <p className="text-gray-500 text-sm mb-6">
                If that email address is registered, you&apos;ll receive a password reset link shortly.
                The link expires in 1 hour.
              </p>
              <Link href="/login" className="text-sm text-primary-600 hover:underline">
                Back to Sign In
              </Link>
            </div>
          ) : (
            /* ── Email entry form ────────────────────────── */
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Forgot your password?</h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter your account email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="you@business.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold rounded-lg transition text-sm"
                >
                  {loading ? "Sending…" : "Send Reset Link"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                Remembered it?{" "}
                <Link href="/login" className="text-primary-600 font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
