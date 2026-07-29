import dynamic from "next/dynamic";

const ReportsGenerator = dynamic(
  () => import("@/features/accounts/ReportsGenerator"),
  { ssr: false }
);

export default function ReportsPage() {
  return (
    <div className="pb-20 animate-in fade-in duration-500">
      <ReportsGenerator />
    </div>
  );
}
