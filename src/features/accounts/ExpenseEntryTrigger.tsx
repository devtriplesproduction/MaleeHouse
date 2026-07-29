'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ExpenseEntryModal } from './ExpenseEntryModal';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function ExpenseEntryTrigger({ projects }: { projects: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
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
