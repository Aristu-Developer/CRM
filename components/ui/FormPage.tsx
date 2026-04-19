"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

// ─── FormPage ─────────────────────────────────────────────────────────────────
// Provides the breadcrumb navigation, page title, description, and error banner
// for all "new/edit" form pages. Wraps children in a consistent max-width.

interface FormPageProps {
  breadcrumb: { label: string; href: string };
  title: string;
  description?: string;
  error?: string;
  maxWidth?: "2xl" | "3xl" | "4xl";
  children: React.ReactNode;
}

export function FormPage({
  breadcrumb,
  title,
  description,
  error,
  maxWidth = "3xl",
  children,
}: FormPageProps) {
  const widthClass = {
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  }[maxWidth];

  return (
    <div className={widthClass}>
      {/* Breadcrumb + page heading */}
      <div className="mb-7">
        <nav className="flex items-center gap-1.5 text-sm mb-2" aria-label="Breadcrumb">
          <Link
            href={breadcrumb.href}
            className="text-gray-400 hover:text-primary-600 transition-colors"
          >
            {breadcrumb.label}
          </Link>
          <svg
            className="w-3.5 h-3.5 text-gray-300 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-700 font-medium">{title}</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>

      {/* Error banner — only rendered when error is non-empty */}
      {error && (
        <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <svg
            className="w-4 h-4 text-red-500 mt-0.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {children}
    </div>
  );
}

// ─── FormActions ──────────────────────────────────────────────────────────────
// Bottom action row: cancel (text link left) + save button (primary right).
// Used at the bottom of every form — no cancel button in the page header.

interface FormActionsProps {
  cancelHref: string;
  saving?: boolean;
  saveLabel?: string;
  disabled?: boolean;
}

export function FormActions({
  cancelHref,
  saving,
  saveLabel = "Save",
  disabled,
}: FormActionsProps) {
  return (
    <div className="flex items-center justify-between pt-1 pb-4">
      <Link
        href={cancelHref}
        className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
      >
        ← Cancel
      </Link>
      <Button type="submit" loading={saving} disabled={disabled} size="lg">
        {saveLabel}
      </Button>
    </div>
  );
}
