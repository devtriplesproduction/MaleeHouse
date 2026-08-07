'use client';

import React from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Mail, 
  ShieldCheck, 
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { createPortal } from 'react-dom';
import { generateQuotationPDF } from '@/lib/pdf-generator';
import { type CompanySettings } from '@/actions/settings.actions';
import { useCompanySettings } from '@/providers/CompanySettingsProvider';
import { getBankAccountsAction } from '@/actions/bank.actions';
import { QuotationItem } from '@/validations/quotation.schema';
import { QuotationDocument } from './QuotationDocument';

interface QuotationPreviewProps {
  quotation: any;
  project: any;
  onClose: () => void;
}

export function QuotationPreview({ quotation, project, onClose }: QuotationPreviewProps) {
  const [mounted, setMounted] = React.useState(false);
  const { settings: companySettings } = useCompanySettings();
  const [bank, setBank] = React.useState<any>(null);

  React.useEffect(() => {
    setMounted(true);
    if (quotation.bank_id) {
      getBankAccountsAction().then(res => {
        if (res && res.success && res.data) {
          setBank(res.data.find((b: any) => b.id === quotation.bank_id) || null);
        }
      });
    }
  }, [quotation.bank_id]);

  const items = quotation.items || [];
  const discountAmount = quotation.discount_amount || 0;
  const discountPercentage = quotation.discount_pct || quotation.discount_percentage || 0;
  
  // Deduplicate clauses to prevent legacy duplication issues
  const rawClauses = quotation.clauses || [];
  const clausesMap = new Map();
  rawClauses.forEach((c: any) => {
    const title = c.title || c.clause_title;
    if (title && !clausesMap.has(title)) {
      clausesMap.set(title, c);
    }
  });
  const clauses = Array.from(clausesMap.values());
  
  if (!mounted || !companySettings) return null;
  
  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto p-6 md:p-12 flex justify-center items-start animate-in fade-in duration-300">
      {/* Full screen backdrop that blurs everything, including the sidebar */}
      <div 
        className="fixed inset-0 bg-slate-950/60 dark:bg-black/85 backdrop-blur-md z-0" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-[850px] flex flex-col gap-6 z-10 my-4">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between bg-slate-900/95 dark:bg-slate-950/90 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10 shadow-xl text-white">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <FileText className="w-4 h-4" />
             </div>
             <div>
                <h3 className="text-sm font-semibold tracking-tight">Quotation Preview</h3>
                <p className="text-[10px] text-slate-400 font-medium">Reviewing {quotation.quotation_number}</p>
             </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={() => generateQuotationPDF(quotation, project, companySettings, bank)}
              variant="ghost" 
              className="text-slate-300 hover:text-white hover:bg-white/10 px-3 py-1.5 h-8 text-xs font-semibold gap-1.5 rounded-lg transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </Button>
            <Button 
              onClick={() => generateQuotationPDF(quotation, project, companySettings, bank)}
              variant="ghost" 
              className="text-slate-300 hover:text-white hover:bg-white/10 px-3 py-1.5 h-8 text-xs font-semibold gap-1.5 rounded-lg transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </Button>
            <Button 
              variant="ghost" 
              className="text-slate-300 hover:text-white hover:bg-white/10 px-3 py-1.5 h-8 text-xs font-semibold gap-1.5 rounded-lg transition-all"
            >
              <Mail className="w-3.5 h-3.5" />
              Email
            </Button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <Button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center p-0 transition-colors"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <QuotationDocument quotation={quotation} project={project} companySettings={companySettings} bank={bank} />
      </div>
    </div>,
    document.body
  );
}
