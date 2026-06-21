'use client';

import React, { useState } from 'react';
import { Archive, Loader2, Star, MessageSquare } from 'lucide-react';
import { archiveProjectAction } from '@/actions/workflow.actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ProjectArchiveButtonProps {
  projectId: string;
}

export function ProjectArchiveButton({ projectId }: ProjectArchiveButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isArchiving, setIsArchiving] = useState(false);
  const [score, setScore] = useState<number>(5);
  const [note, setNote] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const res = await archiveProjectAction(projectId, score, note);
      if (res?.success) {
        toast({
          title: "Project Archived",
          description: "Project has been closed and moved to archives.",
          variant: "success"
        });
        setIsOpen(false);
        router.push('/projects');
      } else {
        toast({
          title: "Archival Failed",
          description: res?.error || "An unknown error occurred.",
          variant: "error"
        });
      }
    } catch (err) {
      toast({
        title: "System Error",
        description: "An error occurred during archival.",
        variant: "error"
      });
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all"
        >
          <Archive className="w-3.5 h-3.5" />
          Archive Project
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass-card border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Archive Project</DialogTitle>
          <DialogDescription className="text-slate-500">
            This will close the project and mark all pending tasks as complete.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Client Satisfaction
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setScore(star)}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all border",
                    score >= star 
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]" 
                      : "bg-white/5 border-white/10 text-slate-500 hover:border-slate-400"
                  )}
                >
                  <Star className={cn("w-5 h-5", score >= star && "fill-current")} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              Project Completion Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="How did it go? Any final feedback from the client?"
              className="w-full h-24 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-bold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleArchive}
            disabled={isArchiving}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isArchiving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Archive className="w-4 h-4" />
            )}
            Complete & Archive
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
