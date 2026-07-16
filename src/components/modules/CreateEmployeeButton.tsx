"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { OnboardUserModal } from "@/components/modules/OnboardUserModal";

export function CreateEmployeeButton({ existingUsers }: { existingUsers: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setIsModalOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium border-none"
      >
        <UserPlus className="mr-2 h-4 w-4" />
        Create Employee
      </Button>

      {isModalOpen && (
        <OnboardUserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          existingUsers={existingUsers}
        />
      )}
    </>
  );
}
