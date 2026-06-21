import { getCompanySettingsAction } from "@/actions/settings.actions";
import { CompanySettingsForm } from "@/components/settings/CompanySettingsForm";
import { getUserProfileAction } from "@/actions/auth.actions";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Company Settings | Malee House",
};

export default async function SettingsPage() {
  const profile = await getUserProfileAction();
  
  if (!profile || (profile.role !== "admin" && profile.role !== "accountant")) {
    redirect("/unauthorized");
  }

  const initialSettings = await getCompanySettingsAction();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Company Settings</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage global company details and preferences</p>
        </div>
      </div>

      <CompanySettingsForm initialSettings={initialSettings} />
    </div>
  );
}
