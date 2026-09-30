"use client";

import React, { useState } from 'react';
import { BookOpen, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SOPModal } from './SOPModal';
import { PageHeader } from '@/components/modules/PageHeader';

interface SOPHeaderProps {
  isAdmin: boolean;
}

export function SOPHeader({ isAdmin }: SOPHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <PageHeader
      icon={BookOpen}
      title={
        <span className="text-3xl">
          Standard Operating <span className="text-indigo-600 dark:text-indigo-400">Procedures</span>
        </span>
      }
      subtitle="Centralized guidelines and procedures for Malee House operations."
      actions={
        <>
          <div className="relative group flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search procedures..." 
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
            />
          </div>

          {isAdmin && (
            <>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-6 shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                <span>Create SOP</span>
              </Button>
              <SOPModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
              />
            </>
          )}
        </>
      }
    />
  );
}
