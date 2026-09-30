import React from 'react';
import { DEFAULT_COMPANY_SETTINGS } from '../../constants/company';

interface DocumentHeaderProps {
  companySettings?: any;
}

export function DocumentHeader({ companySettings }: DocumentHeaderProps) {
  const settings = companySettings || DEFAULT_COMPANY_SETTINGS;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {/* Replace the manual "M" logo and text with the actual company logo from public folder */}
        <img 
          src={settings.logoUrl || "/maleehouse Logo.png"} 
          alt={`${settings.name} Logo`} 
          className="h-12 w-auto object-contain" 
        />
      </div>
      
      <div className="text-[11px] text-slate-500 leading-relaxed font-medium">
         <p className="font-semibold text-slate-800">{settings.name || 'Malee House Head Office'}</p>
         <p>{settings.address || '4th Floor, Alpha Block, Sigma Tech Park'}</p>
         <p>{settings.cityStateZip || 'Whitefield, Bangalore, Karnataka 560066'}</p>
         <p className="text-[10px] mt-0.5 font-semibold text-indigo-600/80">
            GSTIN: {settings.gstin || '36AAAAA1111A1Z1'} | Tel: {settings.telephone || '+91 80 4987 6543'}
         </p>
      </div>
    </div>
  );
}
