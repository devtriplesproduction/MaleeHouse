"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectItem } from "@/components/ui/select";

export default function UserSelector({ 
  users, 
  currentUserId 
}: { 
  users: { id: string; first_name: string; last_name: string }[]; 
  currentUserId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleUserChange = (userId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (userId && userId !== "all") {
      params.set("userId", userId);
    } else {
      params.delete("userId");
    }
    router.push(`/accounts/audit?${params.toString()}`);
  };

  return (
    <Select
      value={currentUserId || "all"}
      onValueChange={handleUserChange}
      placeholder="Select User"
      className="w-full sm:w-[200px]"
      buttonClassName="text-xs font-semibold h-9 rounded-xl py-1.5 px-3 bg-white dark:bg-slate-900/50 border-slate-200/80 dark:border-white/10"
    >
      <SelectItem value="all">All Users</SelectItem>
      {users.map((u) => (
        <SelectItem key={u.id} value={u.id}>
          {u.first_name} {u.last_name}
        </SelectItem>
      ))}
    </Select>
  );
}
