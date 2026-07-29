import { redirect } from "next/navigation";

// Legacy URL → unified Ledger workspace
export default function IncomeLedgerPage() {
  redirect("/accounts/ledger");
}
