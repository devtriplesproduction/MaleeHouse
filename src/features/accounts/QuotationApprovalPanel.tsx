'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, XCircle, MessageSquare, Send, Loader2,
  ShieldCheck, AlertTriangle, RefreshCw, UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateQuotationStatusAction } from '@/actions/quotation.actions';
import { toast } from 'sonner';

interface QuotationApprovalPanelProps {
  quotation: any;
  project: any;
  userRole: string;
  onUpdate: () => void;
}

type Action = 'approve' | 'reject' | 'revision' | 'send' | 'approve_on_behalf' | null;

export function QuotationApprovalPanel({ quotation, project, userRole, onUpdate }: QuotationApprovalPanelProps) {
  const router = useRouter();
  const [action, setAction] = useState<Action>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const isAccountant = userRole === 'accountant' || userRole === 'admin';

  // What's available per status
  const canSend = isAccountant && quotation.status === 'Draft';
  const canMarkSentApproved = isAccountant && (quotation.status === 'Sent' || quotation.status === 'Viewed');
  const canMarkSentRejected = isAccountant && (quotation.status === 'Sent' || quotation.status === 'Viewed');
  const canRequestRevision = isAccountant && (quotation.status === 'Sent' || quotation.status === 'Viewed');
  const canRedraft = isAccountant && quotation.status === 'Revision Requested';

  const noActions = !canSend && !canMarkSentApproved && !canMarkSentRejected && !canRequestRevision && !canRedraft;

  const handleSubmit = async () => {
    if (!action) return;
    if (action === 'reject' && !comment.trim()) {
      toast.error('Rejection reason required', { description: 'Please enter a reason for rejecting the quotation.' });
      return;
    }

    const statusMap: Record<string, string> = {
      approve: 'Approved',
      approve_on_behalf: 'Approved',
      reject: 'Rejected',
      revision: 'Revision Requested',
      send: 'Sent',
    };

    setLoading(true);
    const res = await updateQuotationStatusAction({
      id: quotation.id,
      status: statusMap[action] as any,
      comment: comment || undefined,
      rejection_reason: action === 'reject' ? comment : undefined,
    });

    if (res.success) {
      const messages: Record<string, string> = {
        approve: '🎉 Quotation Approved!',
        approve_on_behalf: '✅ Marked as Approved on behalf of client',
        reject: 'Quotation rejected',
        revision: 'Revision requested',
        send: 'Quotation sent to client',
      };
      toast.success(messages[action] || 'Updated', { description: comment || 'Workflow updated.' });
      setAction(null);
      setComment('');
      
      if (action === 'approve' || action === 'approve_on_behalf') {
        router.push('/accounts/approvals');
      } else {
        onUpdate();
      }
    } else {
      toast.error('Action failed', { description: res.error || 'An unexpected error occurred.' });
    }
    setLoading(false);
  };


  if (noActions) {
    return (
      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
        <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
        <div>
          <p className="text-xs font-medium text-slate-500">{quotation.status}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">No actions available at this stage.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">

        {/* Send to Client */}
        {canSend && (
          <button onClick={() => setAction('send')}
            className={cn('inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border',
              action === 'send'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                : 'bg-white dark:bg-white/5 text-blue-600 border-blue-400/30 hover:bg-blue-50 dark:hover:bg-blue-500/10')}>
            <Send className="w-3.5 h-3.5" /> Send to Client
          </button>
        )}

        {/* Mark Approved on behalf of client */}
        {canMarkSentApproved && (
          <button onClick={() => setAction('approve_on_behalf')}
            className={cn('inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border',
              action === 'approve_on_behalf'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                : 'bg-white dark:bg-white/5 text-emerald-600 border-emerald-400/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10')}>
            <UserCheck className="w-3.5 h-3.5" /> Approved by Client
          </button>
        )}

        {/* Request Revision */}
        {canRequestRevision && (
          <button onClick={() => setAction('revision')}
            className={cn('inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border',
              action === 'revision'
                ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                : 'bg-white dark:bg-white/5 text-amber-600 border-amber-400/30 hover:bg-amber-50 dark:hover:bg-amber-500/10')}>
            <MessageSquare className="w-3.5 h-3.5" /> Request Revision
          </button>
        )}

        {/* Reject */}
        {canMarkSentRejected && (
          <button onClick={() => setAction('reject')}
            className={cn('inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border',
              action === 'reject'
                ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20'
                : 'bg-white dark:bg-white/5 text-rose-600 border-rose-400/30 hover:bg-rose-50 dark:hover:bg-rose-500/10')}>
            <XCircle className="w-3.5 h-3.5" /> Reject
          </button>
        )}

        {/* Re-draft */}
        {canRedraft && (
          <button onClick={() => setAction('revision')}
            className={cn('inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border',
              action === 'revision'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white dark:bg-white/5 text-purple-600 border-purple-400/30 hover:bg-purple-50 dark:hover:bg-purple-500/10')}>
            <RefreshCw className="w-3.5 h-3.5" /> Re-draft
          </button>
        )}
      </div>

      {/* Approve-on-behalf warning */}
      {action === 'approve_on_behalf' && (
        <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/25 flex gap-2.5">
          <AlertTriangle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
            <strong>You are confirming approval on behalf of the client.</strong>{' '}
            Use this when the client has verbally or externally approved and you need to log it in the system.
            The project workflow will transition to <span className="bg-emerald-500/20 px-1 py-0.5 rounded text-[10px]">payment_pending</span>.
          </p>
        </div>
      )}

      {/* Reject warning */}
      {action === 'reject' && (
        <div className="p-3 rounded-xl bg-rose-500/8 border border-rose-500/25 flex gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">
            <strong>Rejection reason is required.</strong> This will be logged in the project audit trail.
          </p>
        </div>
      )}

      {/* Comment / confirm section */}
      {action && (
        <div className="space-y-2.5">
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={
              action === 'approve_on_behalf' ? 'Optional: Add approval note (e.g. verbal approval received on call)...' :
                action === 'reject' ? 'Required: Reason for rejection...' :
                  action === 'revision' ? 'Required: What needs to be revised...' :
                    'Optional: Add note for client...'
            }
            rows={3}
            className="flat-input resize-none text-sm"
          />
          <div className="flex gap-2">
            <button onClick={() => { setAction(null); setComment(''); }}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className={cn('flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5 disabled:opacity-50',
                action === 'approve_on_behalf' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  action === 'reject' ? 'bg-rose-600 hover:bg-rose-700' :
                    action === 'revision' ? 'bg-amber-500 hover:bg-amber-600' :
                      'bg-blue-600 hover:bg-blue-700')}>
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
