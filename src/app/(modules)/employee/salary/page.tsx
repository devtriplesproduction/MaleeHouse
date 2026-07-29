import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserProfileAction } from "@/actions/auth.actions";
import { getMySalarySlipsAction } from "@/actions/payroll.actions";
import { MySalaryClient } from "./MySalaryClient";

export const metadata: Metadata = {
  title: "My Salary Slips | MaleeHouse OS",
  description: "View and download your salary slips",
};

export default async function MySalarySlipsPage() {
  const profile: any = await getUserProfileAction();
  
  if (!profile) {
    redirect("/login");
  }

  // Allow admins and hr to see it for themselves too, or strictly employee.
  // We'll just rely on the RLS policy and fetch it.
  
  const { data: slips, success } = await getMySalarySlipsAction();
  
  const employeeName = profile.first_name 
    ? `${profile.first_name} ${profile.last_name || ''}`.trim() 
    : "Employee";

  return (
    <MySalaryClient 
      slips={success && slips ? slips : []} 
      employeeName={employeeName} 
    />
  );
}
