"use client";

import { useState }         from "react";
import { signIn }           from "next-auth/react";
import { useRouter }        from "next/navigation";
import { useForm }          from "react-hook-form";
import { zodResolver }      from "@hookform/resolvers/zod";
import { z }                from "zod";
import Link                 from "next/link";

const registerSchema = z.object({
  name:            z.string().min(1, "Name is required"),
  email:           z.string().email("Invalid email"),
  password:        z.string().min(6, "Minimum 6 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router                          = useRouter();
  const [error,     setError]           = useState("");
  const [loading,   setLoading]         = useState(false);
  const [checkEmail, setCheckEmail]     = useState(false);
  const [emailUsed,  setEmailUsed]      = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterData) => {
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name: data.name, email: data.email, password: data.password }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Registration failed");
      setLoading(false);
      return;
    }

    const json = await res.json();

    if (json.requiresVerification) {
      // SMTP is configured — show "check your email" screen
      setEmailUsed(data.email);
      setCheckEmail(true);
      setLoading(false);
      return;
    }

    // SMTP not configured (dev mode) — auto sign-in and go to dashboard
    const signInResult = await signIn("credentials", {
      email:    data.email,
      password: data.password,
      redirect: false,
    });

    if (signInResult?.error) {
      setError("Account created. Please sign in to continue.");
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  // ── "Check your email" screen ────────────────────────────────────────────
  if (checkEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 shadow-lg mb-4 hover:opacity-90 transition-all"
            >
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Nepal CRM</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-500 text-sm mb-1">
              We sent a verification link to
            </p>
            <p className="font-semibold text-gray-800 mb-4">{emailUsed}</p>
            <p className="text-gray-400 text-xs mb-6">
              Click the link in the email to activate your account.
              The link will not expire.
            </p>
            <Link
              href="/login"
              className="text-sm text-primary-600 hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration form ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
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
          <p className="text-gray-500 mt-1">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Register</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {[
              { id: "name",            label: "Full Name",        type: "text",     placeholder: "Ram Sharma" },
              { id: "email",           label: "Email address",    type: "email",    placeholder: "ram@business.com" },
              { id: "password",        label: "Password",         type: "password", placeholder: "••••••••" },
              { id: "confirmPassword", label: "Confirm Password", type: "password", placeholder: "••••••••" },
            ].map(({ id, label, type, placeholder }) => (
              <div key={id}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                <input
                  {...register(id as any)}
                  type={type}
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition"
                />
                {(errors as any)[id] && (
                  <p className="mt-1 text-xs text-red-600">{(errors as any)[id].message}</p>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold rounded-lg transition text-sm"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
