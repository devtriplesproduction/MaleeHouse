'use client';

import React, { useState, useEffect } from 'react';
import { Landmark } from 'lucide-react';
import { getBankAccountsAction } from '@/actions/bank.actions';
import { cn } from '@/lib/utils';

interface BankAccountSelectorProps {
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

export function BankAccountSelector({
  value,
  onChange,
  required = false,
  disabled = false,
  className,
  label = 'Bank Account',
  showLabel = true,
}: BankAccountSelectorProps) {
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBankAccountsAction().then(res => {
      if (res.success && res.data) {
        setBanks(res.data);
        // Auto-select default bank if no value set
        if (!value) {
          const def = res.data.find((b: any) => b.is_default) ?? res.data[0];
          if (def) onChange(def.id);
        }
      }
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectClass = cn(
    'w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm',
    (disabled || loading) && 'opacity-60 cursor-not-allowed',
    className
  );

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Landmark className="w-4 h-4 text-slate-400" />
        </div>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          required={required}
          disabled={disabled || loading}
          className={selectClass}
        >
          {loading ? (
            <option value="">Loading banks...</option>
          ) : banks.length === 0 ? (
            <option value="">No bank accounts configured</option>
          ) : (
            <>
              {!value && <option value="" disabled>Select a bank account</option>}
              {banks.map((bank: any) => (
                <option key={bank.id} value={bank.id}>
                  {bank.bank_name} — {bank.account_name} (••••{String(bank.account_number).slice(-4)})
                  {bank.is_default ? ' ★ Default' : ''}
                </option>
              ))}
            </>
          )}
        </select>
      </div>
    </div>
  );
}
