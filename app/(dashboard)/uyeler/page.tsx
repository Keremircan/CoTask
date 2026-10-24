import { Suspense } from "react";
import type { Metadata } from "next";
import { CircleAlert, Lock, ShieldCheck } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";
import { card } from "@/components/ui/styles";
import { MemberRolesEditor } from "@/components/members/member-roles-editor";
import { CreateRoleForm, DeleteRoleButton } from "@/components/members/role-controls";
import { PageHeader } from "../_components/page-header";
import { createAdminClient } from "@/utils/supabase/admin";
import { getMemberPermission } from "@/lib/members";
import {
  AddMemberButton,
  MemberCount,
  MemberPermissionToggle,
  MemberRows,
  MembersProvider,
  RemoveMemberButton,
} from "@/components/members/member-management";

export const metadata: Metadata = { title: "Üyeler · Em3Task" };

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
  const supabase = await createClient();

  // Kullanıcı bilgisi (Admin mi?), yetki ayarı ve sayfa verileri aynı turda, paralel
  const [user, permission, emails, { data: profiles }, { data: roles }, { data: links }] =
    await Promise.all([
      getCurrentUser(),
      getMemberPermission(),
      getMemberEmails(),
      supabase.from("profiles").select("id, full_name, avatar_url").order("full_name"),
      supabase
        .from("roles")
        .select("id, name, is_system")
        .order("is_system", { ascending: false })
        .order("name"),
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
      .sort(
        (a, b) => Number(b.is_system) - Number(a.is_system) || a.name.localeCompare(b.name, "tr"),
      );
  const memberCount = (roleId: string) => (links ?? []).filter((l) => l.role_id === roleId).length;

  const members = profiles ?? [];

  const configured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return (
    <MembersProvider>
      {/* Yetki ayarı: Admin değiştirir; diğerleri sadece durumu görür */}
      <section className={`${card} mb-4 p-4 sm:p-5`}>
        {permission.isAdmin ? (
          <MemberPermissionToggle allowAll={permission.allowAll} />
        ) : (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Lock className="size-4 shrink-0" />
            {permission.allowAll
              ? "Admin, tüm üyelerin üye ekleyip çıkarmasına izin verdi."
              : "Üye ekleme ve çıkarma sadece Admin tarafından yapılır."}
          </p>
        )}
        {permission.canManage && !configured && (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
            Üye ekleme/çıkarma için sunucuda SUPABASE_SERVICE_ROLE_KEY tanımlanmalı.
          </p>
        )}
      </section>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className={`${card} p-4 sm:p-5`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <h2 className="text-base font-bold text-slate-900">Üyeler</h2>
              <MemberCount ids={members.map((p) => p.id)} />
            </div>
            {permission.canManage && <AddMemberButton />}
          </div>
          <MemberRows
            rows={members.map((p) => {
              const name = p.full_name || "İsimsiz üye";
              const memberRoles = rolesOf(p.id);
              const isSelf = p.id === user.id;
              const isAdminMember = memberRoles.some((r) => r.is_system);
              return {
                id: p.id,
                node: (
                  <>
                    <div className="flex min-w-0 items-center gap-3.5">
                      <Avatar name={name} src={p.avatar_url} />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">
                          {name}
                          {isSelf && (
                            <span className="ml-2 text-sm font-medium text-slate-400">(siz)</span>
                          )}
                        </p>
                        {emails.get(p.id) && (
                          <p className="truncate text-xs text-slate-500">{emails.get(p.id)}</p>
                        )}
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {memberRoles.length === 0 && (
                            <span className="text-xs text-slate-400">Rol yok</span>
                          )}
                          {memberRoles.map((r) => (
                            <RoleBadge key={r.id} name={r.name} system={r.is_system} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {user.isAdmin && (
                        <MemberRolesEditor
                          memberId={p.id}
                          memberName={name}
                          roles={editableRoles.map((r) => ({ id: r.id, name: r.name }))}
                          assignedRoleIds={memberRoles.filter((r) => !r.is_system).map((r) => r.id)}
                        />
                      )}
                      {permission.canManage &&
                        (isSelf || isAdminMember ? (
                          <span
                            title={
                              isSelf ? "Kendinizi çıkaramazsınız" : "Admin üyelikten çıkarılamaz"
                            }
                            className="inline-flex items-center gap-1 text-xs text-slate-400"
                          >
                            <Lock className="size-3.5" /> {isSelf ? "Siz" : "Çıkarılamaz"}
                          </span>
                        ) : (
                          <RemoveMemberButton memberId={p.id} memberName={name} />
                        ))}
                    </div>
                  </>
                ),
              };
            })}
          />
        </section>

        <section className={`${card} p-4 sm:p-5`}>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-base font-bold text-slate-900">Roller</h2>
            <span className="text-sm text-slate-500">{allRoles.length} rol</span>
          </div>

          {user.isAdmin ? (
            <div className="mb-4">
              <CreateRoleForm />
            </div>
          ) : (
            <p className="mb-4 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2 text-sm text-slate-500">
              <Lock className="size-4 shrink-0" /> Rolleri sadece Admin oluşturup atayabilir.
            </p>
          )}

          <ul className="space-y-2">
            {allRoles.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-2"
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
    </MembersProvider>
  );
}

// E-postalar auth tablosunda; sunucuda service role ile okunur (anahtar yoksa boş)
async function getMemberEmails(): Promise<Map<string, string>> {
  const admin = createAdminClient();
  if (!admin) return new Map();
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  return new Map((data?.users ?? []).map((u) => [u.id, u.email ?? ""]));
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
    <div className="grid grid-cols-1 animate-pulse gap-4 xl:grid-cols-[1.5fr_1fr]">
      <div className={`${card} h-72`} />
      <div className={`${card} h-72`} />
    </div>
  );
}
