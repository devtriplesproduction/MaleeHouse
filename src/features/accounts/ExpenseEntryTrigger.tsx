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
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm"
      >
        <Plus className="w-4 h-4" /> Record Expense
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
