import { Suspense } from "react";
import type { Metadata } from "next";
import { Lock, ShieldCheck } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";
import { card } from "@/components/ui/styles";
import { MemberRolesEditor } from "@/components/members/member-roles-editor";
import { CreateRoleForm, DeleteRoleButton } from "@/components/members/role-controls";
import { PageHeader } from "../_components/page-header";

export const metadata: Metadata = { title: "Üyeler · CoTask" };

export default function MembersPage() {
  return (
    <>
      <PageHeader title="Üyeler" description="Ekip üyeleri ve rolleri." />
      <Suspense fallback={<MembersSkeleton />}>
        <Members />
      </Suspense>
    </>
  );
}

async function Members() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const [{ data: profiles }, { data: roles }, { data: links }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase.from("roles").select("id, name, is_system").order("is_system", { ascending: false }).order("name"),
    supabase.from("member_roles").select("profile_id, role_id"),
  ]);

  const allRoles = roles ?? [];
  const roleById = new Map(allRoles.map((r) => [r.id, r]));
  const editableRoles = allRoles.filter((r) => !r.is_system);
  const rolesOf = (profileId: string) =>
    (links ?? [])
      .filter((l) => l.profile_id === profileId)
      .map((l) => roleById.get(l.role_id))
      .filter((r) => r !== undefined)
      .sort((a, b) => Number(b.is_system) - Number(a.is_system) || a.name.localeCompare(b.name, "tr"));
  const memberCount = (roleId: string) =>
    (links ?? []).filter((l) => l.role_id === roleId).length;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <section className={`${card} p-6 sm:p-7`}>
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-[20px] font-bold text-slate-900">Üyeler</h2>
          <span className="text-[15px] text-slate-500">{profiles?.length ?? 0} kişi</span>
        </div>
        <ul className="divide-y divide-slate-100">
          {(profiles ?? []).map((p) => {
            const name = p.full_name || "İsimsiz üye";
            const memberRoles = rolesOf(p.id);
            return (
              <li
                key={p.id}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <Avatar name={name} />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">
                      {name}
                      {p.id === user.id && (
                        <span className="ml-2 text-sm font-medium text-slate-400">(siz)</span>
                      )}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {memberRoles.length === 0 && (
                        <span className="text-sm text-slate-400">Rol yok</span>
                      )}
                      {memberRoles.map((r) => (
                        <RoleBadge key={r.id} name={r.name} system={r.is_system} />
                      ))}
                    </div>
                  </div>
                </div>
                {user.isAdmin && (
                  <MemberRolesEditor
                    memberId={p.id}
                    memberName={name}
                    roles={editableRoles.map((r) => ({ id: r.id, name: r.name }))}
                    assignedRoleIds={memberRoles.filter((r) => !r.is_system).map((r) => r.id)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className={`${card} p-6 sm:p-7`}>
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-[20px] font-bold text-slate-900">Roller</h2>
          <span className="text-[15px] text-slate-500">{allRoles.length} rol</span>
        </div>

        {user.isAdmin ? (
          <div className="mb-5">
            <CreateRoleForm />
          </div>
        ) : (
          <p className="mb-5 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            <Lock className="size-4 shrink-0" /> Rolleri sadece Admin oluşturup atayabilir.
          </p>
        )}

        <ul className="space-y-2">
          {allRoles.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <RoleBadge name={r.name} system={r.is_system} />
                <span className="text-sm text-slate-500">{memberCount(r.id)} üye</span>
              </div>
              {r.is_system ? (
                <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                  <Lock className="size-3.5" /> Sabit rol
                </span>
              ) : (
                user.isAdmin && <DeleteRoleButton roleId={r.id} roleName={r.name} />
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function RoleBadge({ name, system }: { name: string; system: boolean }) {
  return system ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-teal-600 px-2 py-0.5 text-xs font-bold text-white">
      <ShieldCheck className="size-3.5" /> {name}
    </span>
  ) : (
    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
      {name}
    </span>
  );
}

function MembersSkeleton() {
  return (
    <div className="grid animate-pulse gap-6 xl:grid-cols-[1.5fr_1fr]">
      <div className={`${card} h-72`} />
      <div className={`${card} h-72`} />
    </div>
  );
}
