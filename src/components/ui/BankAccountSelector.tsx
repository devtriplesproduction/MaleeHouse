'use client';

import React, { useState, useEffect } from 'react';
import { Landmark } from 'lucide-react';
import { getBankAccountsAction } from '@/actions/bank.actions';
import { cn } from '@/lib/utils';
import { Select, SelectItem } from '@/components/ui/select';

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
        if (!value) {
          const def = res.data.find((b: any) => b.is_default) ?? res.data[0];
          if (def) onChange(def.id);
        }
      }
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-1.5 w-full">
      {showLabel && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          <Landmark className="w-4 h-4 text-slate-400" />
        </div>
        <Select
          value={value}
          onValueChange={onChange}
          disabled={disabled || loading}
          placeholder={loading ? "Loading..." : "Select a bank"}
          buttonClassName={cn("pl-10 h-full", className)}
          className="h-full"
        >
          {banks.map((bank: any) => (
            <SelectItem key={bank.id} value={bank.id}>
              {bank.bank_name}
            </SelectItem>
          ))}
        </Select>
      </div>
    </div>
  );
}
