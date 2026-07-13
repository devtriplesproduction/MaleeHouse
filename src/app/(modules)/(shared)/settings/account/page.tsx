import { getUserProfileAction } from "@/actions/auth.actions";
import { redirect } from "next/navigation";
import { BankManagementPanel } from "@/features/accounts/BankManagementPanel";

export const metadata = {
  title: "Company Account Settings | Malee House",
};

export default async function CompanyAccountSettingsPage() {
  const profile = await getUserProfileAction();
  
  if (!profile) {
    redirect("/login");
  }

  // The BankManagementPanel manages its own state and data fetching.

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Company Bank Accounts</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage multiple bank accounts used across quotations and invoices</p>
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
        <BankManagementPanel />
      </div>
    </div>
  );
}
