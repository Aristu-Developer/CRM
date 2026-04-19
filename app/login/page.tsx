"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";

const loginSchema = z.object({
  email:    z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router                          = useRouter();
  const [error,       setError]         = useState("");
  const [loading,     setLoading]       = useState(false);
  const [unverified,  setUnverified]    = useState(false);  // email_not_verified gate
  const [resendEmail, setResendEmail]   = useState("");
  const [resending,   setResending]     = useState(false);
  const [resendDone,  setResendDone]    = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginData) => {
    setLoading(true);
    setError("");
    setUnverified(false);
    setResendDone(false);

    const res = await signIn("credentials", {
      email:    data.email,
      password: data.password,
      redirect: false,
    });

    if (res?.error === "email_not_verified") {
      setUnverified(true);
      setResendEmail(data.email);
      setError("Please verify your email before signing in.");
      setLoading(false);
    } else if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendDone(false);
    await fetch("/api/auth/resend-verification", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: resendEmail }),
    });
    setResending(false);
    setResendDone(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="group inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 shadow-lg mb-4 hover:opacity-90 hover:scale-[1.03] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            aria-label="Nepal CRM — go to home page"
          >
            <svg className="w-8 h-8 text-white" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Nepal CRM</h1>
          <p className="text-gray-500 mt-1">Business management made simple</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
              {unverified && (
                <div className="mt-2 pt-2 border-t border-red-200">
                  {resendDone ? (
                    <p className="text-xs text-red-600">Verification email sent — check your inbox.</p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="text-xs font-medium text-red-700 underline hover:text-red-900 disabled:opacity-50"
                    >
                      {resending ? "Sending…" : "Resend verification email"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                {...register("email")}
                type="email"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition"
                placeholder="you@business.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                {...register("password")}
                type="password"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition"
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold rounded-lg transition text-sm"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary-600 font-medium hover:underline">
              Register
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
