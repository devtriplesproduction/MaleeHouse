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
        variant="hr"
        onClick={() => setIsModalOpen(true)}
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
