"use client";

import React, { useState } from 'react';
import { 
  FileText, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Users, 
  Globe,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteSOPAction } from '@/actions/sop.actions';
import { toast } from 'sonner';
import { SOPModal } from './SOPModal';
import { SOPViewModal } from './SOPViewModal';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface SOPListProps {
  sops: any[];
  isAdmin: boolean;
  currentRole?: string;
}

export function SOPList({ sops, isAdmin, currentRole }: SOPListProps) {
  const [editingSop, setEditingSop] = useState<any>(null);
  const [viewingSop, setViewingSop] = useState<any>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SOP?')) return;
    
    const res = await deleteSOPAction(id);
    if (res.success) {
      toast.success('SOP deleted successfully');
    } else {
      toast.error(res.error || 'Failed to delete SOP');
    }
  };

  if (sops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
        <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No procedures found</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-xs text-center mt-2">
          {isAdmin 
            ? "Get started by creating the first Standard Operating Procedure for the team."
            : "There are currently no SOPs available for your role."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sops.map((sop) => (
        <div 
          key={sop.id} 
          className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-500/20 transition-all duration-300"
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
              sop.target_role ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600'
            }`}>
              {sop.target_role ? <Users className="h-6 w-6" /> : <Globe className="h-6 w-6" />}
            </div>

            {isAdmin && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                  onClick={() => setEditingSop(sop)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(sop.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                {sop.target_role || 'Common'}
              </Badge>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-1">
              {sop.title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {sop.content}
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              <span>{format(new Date(sop.created_at), 'MMM dd, yyyy')}</span>
            </div>
            <Button 
              variant="ghost" 
              className="p-0 h-auto text-indigo-600 hover:text-indigo-700 font-bold text-xs flex items-center gap-1"
              onClick={() => setViewingSop(sop)}
            >
              Read More <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}

      {editingSop && (
        <SOPModal 
          isOpen={!!editingSop} 
          onClose={() => setEditingSop(null)} 
          sop={editingSop}
        />
      )}
      {viewingSop && (
        <SOPViewModal 
          isOpen={!!viewingSop} 
          onClose={() => setViewingSop(null)} 
          sop={viewingSop}
        />
      )}
    </div>
  );
}
