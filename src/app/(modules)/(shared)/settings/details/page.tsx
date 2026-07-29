import { getCompanySettingsAction } from "@/actions/settings.actions";
import { CompanySettingsForm } from "@/components/settings/CompanySettingsForm";
import { getUserProfileAction } from "@/actions/auth.actions";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";

export const metadata = {
  title: "Company Settings | Malee House",
};

export default async function CompanyDetailsSettingsPage() {
  const profile = await getUserProfileAction();

  if (!profile) redirect("/login");

  const canEdit = profile.role === "admin" || profile.role === "accountant";
  const initialSettings = await getCompanySettingsAction();

  return (
    <div className="animate-in fade-in duration-500 pb-20 space-y-8">

      {/* ── Page Header ── */}
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
            Company Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Manage your company's registered details and contact information.
          </p>
        </div>
      </div>

      <CompanySettingsForm initialSettings={initialSettings} canEdit={canEdit} activeTab="details" />
    </div>
  );
}
