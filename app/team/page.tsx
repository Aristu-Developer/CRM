"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Member {
  id:        string;
  name:      string;
  email:     string;
  role:      string;
  isActive:  boolean;
  createdAt: string;
}

interface Invite {
  id:          string;
  email:       string;
  role:        string;
  status:      string;
  message:     string | null;
  createdAt:   string;
  invitedBy:   { id: string; name: string; email: string };
  acceptedBy?: { id: string; name: string } | null;
}

// ─── Invite form schema ────────────────────────────────────────────────────────

const inviteSchema = z.object({
  email:   z.string().email("Enter a valid email address"),
  role:    z.enum(["ADMIN", "STAFF"]),
  message: z.string().optional(),
});

type InviteData = z.infer<typeof inviteSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  return role === "ADMIN" ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
      Admin
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
      Staff
    </span>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Inactive
    </span>
  );
}

function InviteStatusBadge({ status }: { status: string }) {
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
        Pending
      </span>
    );
  }
  if (status === "ACCEPTED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Accepted
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Canceled
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
      {initials}
    </div>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const { data: session, status } = useSession();
  const isAdmin = status === "authenticated" && session?.user?.role === "ADMIN";

  const [tab,     setTab]     = useState<"members" | "invites">("members");
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [actionMsg,  setActionMsg]  = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [canceling,  setCanceling]  = useState<string | null>(null);
  const [toggling,   setToggling]   = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "STAFF" },
  });

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) setMembers(await res.json());
    } catch {}
  }, []);

  const fetchInvites = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch("/api/team/invites");
      if (res.ok) setInvites(await res.json());
    } catch {}
  }, [isAdmin]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchMembers(), fetchInvites()]);
      setLoading(false);
    })();
  }, [fetchMembers, fetchInvites]);

  function flash(type: "success" | "error", text: string) {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 4000);
  }

  // ── Invite member ──────────────────────────────────────────────────────────

  const onInviteSubmit = async (data: InviteData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/team/invites", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { flash("error", json.error ?? "Failed to send invite"); return; }
      await fetchInvites();
      flash("success", `Invite sent to ${data.email}`);
      setShowModal(false);
      reset();
      setTab("invites");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Cancel invite ──────────────────────────────────────────────────────────

  const cancelInvite = async (id: string) => {
    setCanceling(id);
    try {
      const res = await fetch(`/api/team/invites/${id}`, { method: "PATCH" });
      const json = await res.json();
      if (!res.ok) { flash("error", json.error ?? "Failed to cancel invite"); return; }
      setInvites((prev) => prev.map((i) => i.id === id ? { ...i, status: "CANCELED" } : i));
      flash("success", "Invite canceled");
    } finally {
      setCanceling(null);
    }
  };

  // ── Toggle role / active ───────────────────────────────────────────────────

  const updateMember = async (id: string, patch: { role?: string; isActive?: boolean }) => {
    setToggling(id);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok) { flash("error", json.error ?? "Update failed"); return; }
      setMembers((prev) => prev.map((m) => m.id === id ? { ...m, ...patch } : m));
      flash("success", "Member updated");
    } finally {
      setToggling(null);
    }
  };

  // ── Pending invite count for tab badge ────────────────────────────────────

  const pendingCount = invites.filter((i) => i.status === "PENDING").length;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage team members and invites</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { reset(); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Invite Member
          </button>
        )}
      </div>

      {/* Flash message */}
      {actionMsg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm border ${
          actionMsg.type === "success"
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-red-50 border-red-200 text-red-700"
        }`}>
          {actionMsg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {(["members", "invites"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px capitalize ${
              tab === t
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "members" ? "Members" : (
              <span className="flex items-center gap-1.5">
                Pending Invites
                {pendingCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-yellow-100 text-yellow-700">
                    {pendingCount}
                  </span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
            <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading…
          </div>
        ) : tab === "members" ? (
          <MembersTab
            members={members}
            currentUserId={session?.user?.id ?? ""}
            isAdmin={isAdmin}
            toggling={toggling}
            onUpdate={updateMember}
            onInvite={() => { reset(); setShowModal(true); }}
          />
        ) : (
          <InvitesTab
            invites={invites}
            isAdmin={isAdmin}
            canceling={canceling}
            onCancel={cancelInvite}
          />
        )}
      </div>

      {/* Invite modal */}
      {showModal && (
        <InviteModal
          errors={errors}
          register={register}
          submitting={submitting}
          onSubmit={handleSubmit(onInviteSubmit)}
          onClose={() => { setShowModal(false); reset(); }}
        />
      )}
    </div>
  );
}

// ─── Members tab ──────────────────────────────────────────────────────────────

function MembersTab({
  members, currentUserId, isAdmin, toggling, onUpdate, onInvite,
}: {
  members:       Member[];
  currentUserId: string;
  isAdmin:       boolean;
  toggling:      string | null;
  onUpdate:      (id: string, patch: { role?: string; isActive?: boolean }) => void;
  onInvite:      () => void;
}) {
  if (members.length === 0) {
    return (
      <div className="py-20 text-center">
        <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="font-medium text-gray-500">No team members yet</p>
        <p className="text-sm text-gray-400 mt-1">Invite your team to collaborate.</p>
        {isAdmin && (
          <button
            onClick={onInvite}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Invite Member
          </button>
        )}
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <th className="px-5 py-3">Member</th>
          <th className="px-5 py-3">Role</th>
          <th className="px-5 py-3">Status</th>
          <th className="px-5 py-3">Joined</th>
          {isAdmin && <th className="px-5 py-3 text-right">Actions</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {members.map((m) => {
          const isMe      = m.id === currentUserId;
          const isBusy    = toggling === m.id;
          return (
            <tr key={m.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <Avatar name={m.name} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{m.name}</span>
                      {isMe && (
                        <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">{m.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3.5"><RoleBadge role={m.role} /></td>
              <td className="px-5 py-3.5"><StatusBadge isActive={m.isActive} /></td>
              <td className="px-5 py-3.5 text-gray-500">{fmtDate(m.createdAt)}</td>
              {isAdmin && (
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    {!isMe && (
                      <>
                        <button
                          disabled={isBusy}
                          onClick={() => onUpdate(m.id, { role: m.role === "ADMIN" ? "STAFF" : "ADMIN" })}
                          className="px-2.5 py-1 text-xs font-medium border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          {isBusy ? "…" : m.role === "ADMIN" ? "Make Staff" : "Make Admin"}
                        </button>
                        <button
                          disabled={isBusy}
                          onClick={() => onUpdate(m.id, { isActive: !m.isActive })}
                          className={`px-2.5 py-1 text-xs font-medium border rounded-md disabled:opacity-50 transition-colors ${
                            m.isActive
                              ? "border-red-200 text-red-600 hover:bg-red-50"
                              : "border-green-200 text-green-600 hover:bg-green-50"
                          }`}
                        >
                          {isBusy ? "…" : m.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Invites tab ──────────────────────────────────────────────────────────────

function InvitesTab({
  invites, isAdmin, canceling, onCancel,
}: {
  invites:   Invite[];
  isAdmin:   boolean;
  canceling: string | null;
  onCancel:  (id: string) => void;
}) {
  if (invites.length === 0) {
    return (
      <div className="py-20 text-center text-gray-400">
        <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <p className="font-medium text-gray-500">No invites yet</p>
        <p className="text-sm text-gray-400 mt-1">Send an invite to add someone to your team</p>
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <th className="px-5 py-3">Email</th>
          <th className="px-5 py-3">Role</th>
          <th className="px-5 py-3">Invited By</th>
          <th className="px-5 py-3">Date</th>
          <th className="px-5 py-3">Status</th>
          {isAdmin && <th className="px-5 py-3 text-right">Actions</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {invites.map((inv) => {
          const isBusy = canceling === inv.id;
          return (
            <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5 font-medium text-gray-900">{inv.email}</td>
              <td className="px-5 py-3.5"><RoleBadge role={inv.role} /></td>
              <td className="px-5 py-3.5 text-gray-500">{inv.invitedBy.name}</td>
              <td className="px-5 py-3.5 text-gray-500">{fmtDate(inv.createdAt)}</td>
              <td className="px-5 py-3.5"><InviteStatusBadge status={inv.status} /></td>
              {isAdmin && (
                <td className="px-5 py-3.5 text-right">
                  {inv.status === "PENDING" && (
                    <button
                      disabled={isBusy}
                      onClick={() => onCancel(inv.id)}
                      className="px-2.5 py-1 text-xs font-medium border border-red-200 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      {isBusy ? "Canceling…" : "Cancel"}
                    </button>
                  )}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Invite modal ─────────────────────────────────────────────────────────────

function InviteModal({
  errors, register, submitting, onSubmit, onClose,
}: {
  errors:     any;
  register:   any;
  submitting: boolean;
  onSubmit:   (e: React.FormEvent) => void;
  onClose:    () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Invite Team Member</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
            <input
              {...register("email")}
              type="email"
              placeholder="colleague@example.com"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
            <select
              {...register("role")}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white transition"
            >
              <option value="STAFF">Staff — can view and create records</option>
              <option value="ADMIN">Admin — full access including team management</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Message <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              {...register("message")}
              rows={3}
              placeholder="Add a personal note to your invite…"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {submitting ? "Sending…" : "Send Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
