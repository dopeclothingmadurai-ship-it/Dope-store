"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { SectionCard } from "@/components/admin/section-card";
import { cn } from "@/lib/utils";

import { updateStaffRoleAction } from "../actions";
import { type StaffMember, type StaffRole } from "../types";

const ROLES: StaffRole[] = ["owner", "manager", "editor", "staff"];

const ROLE_STYLES: Record<StaffRole, string> = {
  owner: "bg-white/10 text-white border-white/20",
  manager: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  editor: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  staff: "bg-white/5 text-muted-foreground border-white/10",
};

const selectClass = cn(
  "text-foreground border-input bg-white/[0.02] hover:bg-white/[0.04] h-8 rounded-lg border px-2 text-sm outline-none transition-colors disabled:opacity-50",
  "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px]",
);

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function StaffSection({ staff }: { staff: StaffMember[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const canManage = staff.some(
    (member) => member.isSelf && member.role === "owner",
  );

  async function changeRole(member: StaffMember, role: StaffRole) {
    if (role === member.role) return;
    setPendingId(member.id);
    const res = await updateStaffRoleAction(member.id, role);
    setPendingId(null);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Role updated");
    router.refresh();
  }

  return (
    <SectionCard
      title="Admin users"
      description={
        canManage
          ? "Owners can change roles. The last owner can't be removed."
          : "Only owners can change staff roles."
      }
    >
      <ul className="divide-border/60 divide-y">
        {staff.map((member) => (
          <li
            key={member.id}
            className="flex flex-wrap items-center gap-3 py-3"
          >
            <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ring-1 ring-white/10">
              {(member.email.charAt(0) || "?").toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {member.email}
                {member.isSelf ? (
                  <span className="text-muted-foreground"> (you)</span>
                ) : null}
              </p>
              <p className="text-muted-foreground text-xs">
                Added {dateFmt.format(new Date(member.createdAt))}
              </p>
            </div>
            <span
              className={cn(
                "hidden rounded-full border px-2.5 py-1 text-xs font-medium capitalize sm:inline-flex",
                ROLE_STYLES[member.role],
              )}
            >
              {member.role}
            </span>
            <select
              aria-label={`Role for ${member.email}`}
              className={selectClass}
              value={member.role}
              disabled={!canManage || member.isSelf || pendingId === member.id}
              onChange={(event) =>
                changeRole(member, event.target.value as StaffRole)
              }
            >
              {ROLES.map((role) => (
                <option key={role} value={role} className="capitalize">
                  {role}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground mt-4 text-xs">
        New staff are added by inviting them in Supabase Auth and creating a
        staff profile — that flow is intentionally out of scope here.
      </p>
    </SectionCard>
  );
}
