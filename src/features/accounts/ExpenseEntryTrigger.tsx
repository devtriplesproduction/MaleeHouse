'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ExpenseEntryModal } from './ExpenseEntryModal';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function ExpenseEntryTrigger({ projects, onSuccess }: { projects: any[], onSuccess?: (data?: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = (data?: any) => {
    if (onSuccess) onSuccess(data);
  };

  return (
    <>
      <Button
        variant="hr"
        onClick={() => setIsOpen(true)}
      >
        <Plus className="w-4 h-4 mr-2" />
        Record Expense
      </Button>

      <ExpenseEntryModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        projects={projects}
        onSuccess={handleSuccess}
      />
    </>
  );
}
