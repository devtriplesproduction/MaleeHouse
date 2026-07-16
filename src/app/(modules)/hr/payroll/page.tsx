import { getAllUsersAction } from "@/actions/admin.actions";
import { UserManagementTable } from "@/components/modules/UserManagementTable";

export default async function SalaryRecordsPage() {
  const { data: users, success } = await getAllUsersAction();

  if (!success || !users) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Access Denied</h2>
          <p className="text-slate-500 mt-2">You do not have permission to view payroll records.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserManagementTable initialUsers={users} />
    </div>
  );
}
