"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Loading, SectionTitle, inputClass } from "@/components/ui";
import { apiError, get, post } from "@/lib/api";
import { useApp } from "@/context/AppContext";

type AdminUser = {
  id: number; email: string; role: string; fullName: string; organizationName: string | null;
  city: string | null; language: string; verificationStatus?: string; verificationDocType?: string | null; verificationDocuments?: string | null;
  isSeed: boolean; createdAt: string; challenges: number; projects: number;
};

export default function AdminUsersPage() {
  const { pushToast } = useApp();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("ALL");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    get<{ users: AdminUser[] }>('/admin/users')
      .then((d) => setUsers(d.users))
      .catch((e) => pushToast(apiError(e), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [pushToast]);

  const handleVerify = async (userId: number, status: 'VERIFIED' | 'REJECTED') => {
    setBusyId(userId);
    try {
      await post('/admin/users', { userId, status, notes: status === 'VERIFIED' ? 'Verified by admin after document review.' : 'Rejected by admin during verification review.' });
      pushToast(status === 'VERIFIED' ? 'User approved successfully.' : 'User rejected successfully.', 'success');
      load();
    } catch (e) {
      pushToast(apiError(e), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const filtered = role === 'ALL' ? users : users.filter((u) => u.role === role);

  return (
    <AppShell role="ADMIN">
      <SectionTitle
        title="Users"
        subtitle="Citizens, universities, industries and administrators"
        action={
          <select className={`${inputClass} max-w-[180px]`} value={role} onChange={(e) => setRole(e.target.value)}>
            {["ALL", "CITIZEN", "UNIVERSITY", "INDUSTRY", "ADMIN"].map((r) => (<option key={r}>{r}</option>))}
          </select>
        }
      />
      {loading ? <Loading /> : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">City</th><th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Verification</th><th className="px-4 py-3">Challenges</th><th className="px-4 py-3">Projects</th><th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-3 font-medium">{u.organizationName ?? u.fullName}</td>
                  <td className="px-4 py-3"><Badge tone={u.role === "ADMIN" ? "rose" : u.role === "UNIVERSITY" ? "indigo" : u.role === "INDUSTRY" ? "emerald" : "slate"}>{u.role}</Badge></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">{u.city ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={u.verificationStatus === 'VERIFIED' ? 'emerald' : u.verificationStatus === 'REJECTED' ? 'rose' : 'amber'}>
                      {u.verificationStatus ?? 'PENDING'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[240px]">
                    <div className="font-medium text-slate-700">{u.verificationDocType ?? '—'}</div>
                    <div className="mt-1 line-clamp-2">
                      {u.verificationDocuments ? (u.verificationDocuments.startsWith('data:') ? 'Uploaded document attached' : u.verificationDocuments) : 'No document record yet.'}
                    </div>
                  </td>
                  <td className="px-4 py-3">{u.challenges}</td>
                  <td className="px-4 py-3">{u.projects}</td>
                  <td className="px-4 py-3">
                    {u.role === 'ADMIN' ? <span className="text-xs text-slate-400">System</span> : (
                      <div className="flex gap-2">
                        <Button variant="success" className="px-3 py-1.5 text-xs" disabled={busyId === u.id || u.verificationStatus === 'VERIFIED'} onClick={() => handleVerify(u.id, 'VERIFIED')}>
                          {busyId === u.id ? '...' : 'Approve'}
                        </Button>
                        <Button variant="danger" className="px-3 py-1.5 text-xs" disabled={busyId === u.id || u.verificationStatus === 'REJECTED'} onClick={() => handleVerify(u.id, 'REJECTED')}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </AppShell>
  );
}
