"use client";

import React, { useState } from 'react';
import { BookOpen, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SOPModal } from './SOPModal';

interface SOPHeaderProps {
  isAdmin: boolean;
}

export function SOPHeader({ isAdmin }: SOPHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-3xl font-bold tracking-tight">Standard Operating Procedures</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Centralized guidelines and procedures for Malee House operations.
        </p>
      </div>

      <div className="flex items-center gap-3">
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
      </div>
    </div>
  );
}
