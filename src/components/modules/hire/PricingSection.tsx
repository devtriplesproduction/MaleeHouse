import React from "react";
import { HireTechnologyConfig } from "@/types/hire-technology";

interface PricingSectionProps {
  config: HireTechnologyConfig;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ config }) => {
  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Flexible Pricing Models</h2>
          <p className="text-lg text-slate-600">{config.pricing.description}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Hourly */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 hover:shadow-md transition-shadow flex flex-col">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Hourly</h3>
            <p className="text-slate-500 mb-6">Best for small updates and short-term tasks.</p>
            <div className="text-3xl font-extrabold text-indigo-600 mb-6">{config.pricing.hourly}<span className="text-base font-normal text-slate-500">/hr</span></div>
            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-center text-slate-700"><span className="text-indigo-500 mr-2">✓</span> Pay only for hours worked</li>
              <li className="flex items-center text-slate-700"><span className="text-indigo-500 mr-2">✓</span> Weekly billing</li>
              <li className="flex items-center text-slate-700"><span className="text-indigo-500 mr-2">✓</span> Flexible hours</li>
            </ul>
            <a href="#get-quote" className="w-full block text-center py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg font-semibold transition-colors">Get Started</a>
          </div>
          
          {/* Monthly */}
          <div className="bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20 border border-indigo-500 p-8 transform md:-translate-y-4 flex flex-col relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">Most Popular</div>
            <h3 className="text-xl font-bold text-white mb-2">Monthly</h3>
            <p className="text-indigo-200 mb-6">Best for ongoing projects and dedicated focus.</p>
            <div className="text-3xl font-extrabold text-white mb-6">{config.pricing.monthly}<span className="text-base font-normal text-indigo-200">/mo</span></div>
            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-center text-white"><span className="text-indigo-300 mr-2">✓</span> Dedicated full-time developer</li>
              <li className="flex items-center text-white"><span className="text-indigo-300 mr-2">✓</span> 160 hours per month</li>
              <li className="flex items-center text-white"><span className="text-indigo-300 mr-2">✓</span> Direct communication</li>
              <li className="flex items-center text-white"><span className="text-indigo-300 mr-2">✓</span> Priority support</li>
            </ul>
            <a href="#hire-form" className="w-full block text-center py-3 px-6 bg-white hover:bg-slate-50 text-indigo-600 rounded-lg font-semibold transition-colors">Hire Now</a>
          </div>
          
          {/* Dedicated */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 hover:shadow-md transition-shadow flex flex-col">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Project Based</h3>
            <p className="text-slate-500 mb-6">Best for well-defined projects with clear scope.</p>
            <div className="text-3xl font-extrabold text-indigo-600 mb-6">{config.pricing.dedicated}</div>
            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-center text-slate-700"><span className="text-indigo-500 mr-2">✓</span> Fixed price quote</li>
              <li className="flex items-center text-slate-700"><span className="text-indigo-500 mr-2">✓</span> Dedicated project manager</li>
              <li className="flex items-center text-slate-700"><span className="text-indigo-500 mr-2">✓</span> Milestone based delivery</li>
            </ul>
            <a href="#get-quote" className="w-full block text-center py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg font-semibold transition-colors">Request Quote</a>
          </div>
        </div>
      </div>
    </section>
  );
};
