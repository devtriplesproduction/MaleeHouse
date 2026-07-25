import { PageHeader } from "@/components/modules/PageHeader";
import { BarChart3 } from "lucide-react";
import dynamic from "next/dynamic";

const ReportsGenerator = dynamic(
  () => import("@/features/accounts/ReportsGenerator"),
  { ssr: false }
);

export default function ReportsPage() {
  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <PageHeader
        title="Financial Reports"
        subtitle="Generate, view, and export detailed financial statements."
        icon={BarChart3}
      />
      
      <ReportsGenerator />
    </div>
  );
}
