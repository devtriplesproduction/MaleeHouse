'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ExpenseEntryModal } from './ExpenseEntryModal';
import { useRouter } from 'next/navigation';

export function ExpenseEntryTrigger({ projects }: { projects: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-2xl text-sm font-bold   tracking-wider transition-all shadow-lg active:scale-95 group"
      >
        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" /> Record Expense
      </button>

      <ExpenseEntryModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        projects={projects}
        onSuccess={handleSuccess}
      />
    </>
  );
}
