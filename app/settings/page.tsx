"use client";

import { useState, useEffect }     from "react";
import { PageHeader }               from "@/components/ui/PageHeader";
import { Button }                   from "@/components/ui/Button";
import { Modal }                    from "@/components/ui/Modal";
import { useSession, signOut }      from "next-auth/react";
import {
  MODULE_LIST,
  parseModules,
  applyDependencies,
  DEFAULT_MODULES,
  type ModuleConfig,
} from "@/lib/modules";

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      {children}
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function SaveBanner({ message = "Saved successfully." }: { message?: string }) {
  return (
    <p className="text-xs text-green-700 font-medium flex items-center gap-1.5">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
      {message}
    </p>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <p className="text-xs text-red-600 font-medium">{message}</p>
  );
}

function FieldInput({
  label, value, onChange, placeholder, type = "text", hint, disabled, fullWidth,
}: {
  label: string; value: string | number; onChange: (v: string) => void;
  placeholder?: string; type?: string; hint?: string; disabled?: boolean; fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "col-span-full" : ""}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition"
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const isAdmin = status === "authenticated" && session?.user?.role === "ADMIN";

  // ── Loading ──
  const [loading, setLoading] = useState(true);

  // ── Section 1: Business Information ──
  const [biz, setBiz] = useState({
    businessName:    "",
    businessPhone:   "",
    businessEmail:   "",
    businessAddress: "",
    businessCity:    "",
    invoicePrefix:   "INV",
    lowStockDefault: "10",
    currency:        "NPR",
    currencySymbol:  "Rs.",
  });
  const [bizSaving, setBizSaving] = useState(false);
  const [bizSaved,  setBizSaved]  = useState(false);
  const [bizError,  setBizError]  = useState("");

  // ── Section 2: Feature Modules ──
  const [modules,    setModules]    = useState<ModuleConfig>(DEFAULT_MODULES);
  const [modSaving,  setModSaving]  = useState(false);
  const [modSaved,   setModSaved]   = useState(false);
  const [modError,   setModError]   = useState("");

  // ── Section 3a: Change Email ──
  const [emailForm, setEmailForm] = useState({ newEmail: "", currentPassword: "" });
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSaved,  setEmailSaved]  = useState(false);
  const [emailError,  setEmailError]  = useState("");

  // ── Section 3b: Change Password ──
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved,  setPwSaved]  = useState(false);
  const [pwError,  setPwError]  = useState("");

  // ── Section 4: Danger Zone ──
  const [showDeleteModal,   setShowDeleteModal]   = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting,          setDeleting]          = useState(false);
  const [deleteError,       setDeleteError]       = useState("");

  // ── Load initial data ──
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setBiz({
          businessName:    d.businessName    ?? "",
          businessPhone:   d.businessPhone   ?? "",
          businessEmail:   d.businessEmail   ?? "",
          businessAddress: d.businessAddress ?? "",
          businessCity:    d.businessCity    ?? "",
          invoicePrefix:   d.invoicePrefix   ?? "INV",
          lowStockDefault: String(d.lowStockDefault ?? 10),
          currency:        d.currency        ?? "NPR",
          currencySymbol:  d.currencySymbol  ?? "Rs.",
        });
        setModules(parseModules(d.modules));
        setLoading(false);
      });
  }, []);

  // ── Save handlers ──

  const handleSaveBiz = async () => {
    setBizSaving(true);
    setBizError("");
    try {
      const res = await fetch("/api/settings", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...biz, lowStockDefault: parseInt(biz.lowStockDefault) || 10 }),
      });
      if (!res.ok) {
        const body = await res.json();
        setBizError(body.error ?? "Failed to save.");
      } else {
        setBizSaved(true);
        setTimeout(() => setBizSaved(false), 3000);
      }
    } catch {
      setBizError("Something went wrong.");
    } finally {
      setBizSaving(false);
    }
  };

  const handleSaveModules = async () => {
    setModSaving(true);
    setModError("");
    try {
      const res = await fetch("/api/settings", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ modules }),
      });
      if (!res.ok) {
        const body = await res.json();
        setModError(body.error ?? "Failed to save.");
      } else {
        setModSaved(true);
        setTimeout(() => setModSaved(false), 3000);
      }
    } catch {
      setModError("Something went wrong.");
    } finally {
      setModSaving(false);
    }
  };

  const handleChangeEmail = async () => {
    setEmailSaving(true);
    setEmailError("");
    try {
      const res = await fetch("/api/account/email", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(emailForm),
      });
      const body = await res.json();
      if (!res.ok) {
        setEmailError(body.error ?? "Failed to update email.");
      } else {
        setEmailSaved(true);
        setEmailForm({ newEmail: "", currentPassword: "" });
        setTimeout(() => setEmailSaved(false), 4000);
      }
    } catch {
      setEmailError("Something went wrong.");
    } finally {
      setEmailSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwSaving(true);
    setPwError("");
    try {
      const res = await fetch("/api/account/password", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword:     pwForm.newPassword,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setPwError(body.error ?? "Failed to update password.");
      } else {
        setPwSaved(true);
        setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => setPwSaved(false), 4000);
      }
    } catch {
      setPwError("Something went wrong.");
    } finally {
      setPwSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json();
        setDeleteError(body.error ?? "Failed to delete account");
        setDeleting(false);
        return;
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      setDeleteError("Something went wrong. Please try again.");
      setDeleting(false);
    }
  };

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Settings" description="Manage your business, modules, and account preferences" />

      {!isAdmin && (
        <div className="mb-5 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
          Only admins can modify settings. You are viewing in read-only mode.
        </div>
      )}

      <div className="space-y-6">

        {/* ── Section 1: Business Information ──────────────────────────────── */}
        <SectionCard>
          <SectionTitle
            title="Business Information"
            subtitle="Your business name, contact details, currency, and invoice prefix."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldInput
              label="Business Name"
              value={biz.businessName}
              onChange={(v) => setBiz({ ...biz, businessName: v })}
              placeholder="My Business Pvt. Ltd."
              disabled={!isAdmin}
            />
            <FieldInput
              label="Phone"
              value={biz.businessPhone}
              onChange={(v) => setBiz({ ...biz, businessPhone: v })}
              placeholder="01-XXXXXXX / 98XXXXXXXX"
              disabled={!isAdmin}
            />
            <FieldInput
              label="Business Email"
              value={biz.businessEmail}
              onChange={(v) => setBiz({ ...biz, businessEmail: v })}
              placeholder="info@mybusiness.com"
              type="email"
              disabled={!isAdmin}
            />
            <FieldInput
              label="City"
              value={biz.businessCity}
              onChange={(v) => setBiz({ ...biz, businessCity: v })}
              placeholder="Kathmandu"
              disabled={!isAdmin}
            />
            <FieldInput
              label="Address"
              value={biz.businessAddress}
              onChange={(v) => setBiz({ ...biz, businessAddress: v })}
              placeholder="Thamel, Kathmandu, Bagmati Province"
              disabled={!isAdmin}
              fullWidth
            />

            <div className="col-span-full border-t border-gray-100 pt-4 mt-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Invoice &amp; Currency</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldInput
                  label="Invoice Prefix"
                  value={biz.invoicePrefix}
                  onChange={(v) => setBiz({ ...biz, invoicePrefix: v })}
                  placeholder="INV"
                  disabled={!isAdmin}
                  hint="e.g. INV → INV-00001"
                />
                <FieldInput
                  label="Low Stock Threshold"
                  value={biz.lowStockDefault}
                  onChange={(v) => setBiz({ ...biz, lowStockDefault: v })}
                  type="number"
                  placeholder="10"
                  disabled={!isAdmin}
                  hint="Default alert level for new products"
                />
                <FieldInput
                  label="Currency Code"
                  value={biz.currency}
                  onChange={(v) => setBiz({ ...biz, currency: v })}
                  placeholder="NPR"
                  disabled={!isAdmin}
                />
                <FieldInput
                  label="Currency Symbol"
                  value={biz.currencySymbol}
                  onChange={(v) => setBiz({ ...biz, currencySymbol: v })}
                  placeholder="Rs."
                  disabled={!isAdmin}
                />
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-gray-100">
              {bizSaved  && <SaveBanner />}
              {bizError  && <ErrorBanner message={bizError} />}
              <Button onClick={handleSaveBiz} loading={bizSaving}>Save Business Info</Button>
            </div>
          )}
        </SectionCard>

        {/* ── Section 2: Feature Modules ──────────────────────────────────── */}
        <SectionCard>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Feature Modules</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Enable or disable features for your workspace. Disabled modules are hidden from navigation.
              </p>
            </div>
            <span className="shrink-0 text-xs text-gray-400 mt-0.5">
              {Object.values(modules).filter(Boolean).length} / {MODULE_LIST.length} on
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {MODULE_LIST.map((mod) => {
              const isOn      = modules[mod.id as keyof ModuleConfig];
              const parentOff = mod.dependsOn && !modules[mod.dependsOn as keyof ModuleConfig];
              return (
                <div
                  key={mod.id}
                  className={`flex items-center justify-between py-3 ${parentOff ? "opacity-40" : ""}`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {mod.label}
                      {mod.dependsOn && (
                        <span className="ml-1.5 text-[10px] font-normal text-gray-400">
                          requires {mod.dependsOn}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">{mod.description}</p>
                  </div>
                  <button
                    type="button"
                    disabled={!isAdmin || !!parentOff}
                    onClick={() => {
                      if (!isAdmin || parentOff) return;
                      setModules((prev) =>
                        applyDependencies({ ...prev, [mod.id]: !prev[mod.id as keyof ModuleConfig] })
                      );
                    }}
                    className={`relative ml-4 inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed ${
                      isOn ? "bg-primary-600" : "bg-gray-200"
                    }`}
                    role="switch"
                    aria-checked={isOn}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                        isOn ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>

          {isAdmin && (
            <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-gray-100">
              {modSaved  && <SaveBanner />}
              {modError  && <ErrorBanner message={modError} />}
              <Button onClick={handleSaveModules} loading={modSaving}>Save Modules</Button>
            </div>
          )}
        </SectionCard>

        {/* ── Section 3: Account Settings ─────────────────────────────────── */}
        <SectionCard>
          <SectionTitle
            title="Account Settings"
            subtitle="Update your login email or change your password."
          />

          <div className="space-y-8">
            {/* 3a — Change Email */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Change Email</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldInput
                  label="New Email Address"
                  value={emailForm.newEmail}
                  onChange={(v) => setEmailForm({ ...emailForm, newEmail: v })}
                  type="email"
                  placeholder="newemail@example.com"
                />
                <FieldInput
                  label="Current Password"
                  value={emailForm.currentPassword}
                  onChange={(v) => setEmailForm({ ...emailForm, currentPassword: v })}
                  type="password"
                  placeholder="Confirm with your password"
                />
              </div>
              <div className="flex items-center justify-end gap-3 mt-4">
                {emailSaved && <SaveBanner message="Email updated. Sign in again to refresh your session." />}
                {emailError && <ErrorBanner message={emailError} />}
                <Button
                  onClick={handleChangeEmail}
                  loading={emailSaving}
                  disabled={!emailForm.newEmail || !emailForm.currentPassword}
                >
                  Update Email
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* 3b — Change Password */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Change Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldInput
                  label="Current Password"
                  value={pwForm.currentPassword}
                  onChange={(v) => setPwForm({ ...pwForm, currentPassword: v })}
                  type="password"
                  placeholder="Your current password"
                  fullWidth
                />
                <FieldInput
                  label="New Password"
                  value={pwForm.newPassword}
                  onChange={(v) => setPwForm({ ...pwForm, newPassword: v })}
                  type="password"
                  placeholder="At least 6 characters"
                  hint="Minimum 6 characters"
                />
                <FieldInput
                  label="Confirm New Password"
                  value={pwForm.confirmPassword}
                  onChange={(v) => setPwForm({ ...pwForm, confirmPassword: v })}
                  type="password"
                  placeholder="Repeat new password"
                />
              </div>
              <div className="flex items-center justify-end gap-3 mt-4">
                {pwSaved && <SaveBanner message="Password changed successfully." />}
                {pwError && <ErrorBanner message={pwError} />}
                <Button
                  onClick={handleChangePassword}
                  loading={pwSaving}
                  disabled={!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}
                >
                  Change Password
                </Button>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── Section 4: Danger Zone (admin only) ─────────────────────────── */}
        {isAdmin && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-base font-semibold text-red-900 mb-1">Danger Zone</h2>
            <p className="text-sm text-red-600 mb-5">
              Permanently deletes your entire workspace — customers, products, sales, payments, and all team members.
              This action cannot be undone.
            </p>
            <Button
              variant="danger"
              onClick={() => {
                setDeleteConfirmText("");
                setDeleteError("");
                setShowDeleteModal(true);
              }}
            >
              Delete Workspace
            </Button>
          </div>
        )}

      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => !deleting && setShowDeleteModal(false)}
        title="Delete Workspace"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
            <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-sm text-red-700">
              This will permanently delete your entire workspace including all customers, products, sales, payments, and
              team members. <strong>There is no going back.</strong>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Type <span className="font-mono font-bold">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              disabled={deleting}
              placeholder="DELETE"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-mono disabled:opacity-50"
              autoComplete="off"
            />
          </div>

          {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
              disabled={deleteConfirmText !== "DELETE"}
            >
              Delete Workspace
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
