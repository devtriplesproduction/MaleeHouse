import React from "react";
import { HireTechnologyConfig } from "@/types/hire-technology";

interface ProcessSectionProps {
  config: HireTechnologyConfig;
}

export const ProcessSection: React.FC<ProcessSectionProps> = ({ config }) => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Our Hiring Process</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">A streamlined approach to integrate top {config.name} talent into your team.</p>
        </div>
        
        <div className="max-w-4xl mx-auto relative">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-indigo-100 -translate-x-1/2"></div>
          <div className="space-y-12">
            {config.process.map((step, idx) => (
              <div key={idx} className={`relative flex flex-col md:flex-row ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''} items-center group`}>
                <div className="md:w-1/2"></div>
                <div className="absolute left-4 md:left-1/2 w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center -translate-x-1/2 z-10 border-4 border-white shadow-sm transition-transform group-hover:scale-110">
                  {idx + 1}
                </div>
                <div className="w-full md:w-1/2 pl-12 md:pl-0 md:px-12 pt-2 md:pt-0">
                  <div className={`bg-slate-50 p-6 rounded-2xl shadow-sm border border-slate-100 ${idx % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                    <p className="text-slate-600">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
