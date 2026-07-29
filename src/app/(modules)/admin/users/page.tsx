import React, { Suspense } from "react";
import { 
  Users, 
  Shield, 
  ShieldCheck
} from "lucide-react";
import { getAllUsersAction } from "@/actions/admin.actions";
import { UserManagementTable } from "@/components/modules/UserManagementTable";

export const metadata = {
  title: "User Management | Admin Portal",
};

export default async function UserManagementPage() {
  const result = await getAllUsersAction();

  if (!result.success) {
    return (
      <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400">
        <h2 className="text-xl font-bold">Failed to load users</h2>
        <p className="text-sm mt-1">{result.error}</p>
      </div>
    );
  }

  const users = result.data || [];

  return (
    <div className="animate-in fade-in duration-700">
      <Suspense fallback={<div className="h-[600px] bg-white/5 animate-pulse rounded-2xl" />}>
        <UserManagementTable initialUsers={users} />
      </Suspense>
    </div>
  );
}
