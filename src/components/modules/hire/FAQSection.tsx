"use client";

import React, { useState } from "react";
import { HireTechnologyConfig } from "@/types/hire-technology";
import { ChevronDown } from "lucide-react";

interface FAQSectionProps {
  config: HireTechnologyConfig;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ config }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-slate-600">Common questions about hiring {config.name} developers with us.</p>
        </div>
        
        <div className="space-y-4">
          {config.faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className={`border rounded-xl overflow-hidden transition-all duration-300 ${openIndex === idx ? 'border-indigo-500 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <button 
                onClick={() => toggleFAQ(idx)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
              >
                <span className={`font-semibold text-lg ${openIndex === idx ? 'text-indigo-600' : 'text-slate-900'}`}>
                  {faq.question}
                </span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${openIndex === idx ? 'rotate-180 text-indigo-600' : ''}`} />
              </button>
              <div 
                className={`overflow-hidden transition-all duration-300 ${openIndex === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <p className="p-6 pt-0 text-slate-600 leading-relaxed border-t border-slate-100">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
