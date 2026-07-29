import React from "react";
import { HireTechnologyConfig } from "@/types/hire-technology";

interface HeroSectionProps {
  config: HireTechnologyConfig;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ config }) => {
  return (
    <section className="relative overflow-hidden bg-slate-900 text-white py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-800/20 z-0"></div>
      <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
          {config.heroHeadline}
        </h1>
        <p className="text-xl md:text-2xl text-slate-300 mb-8 font-medium">
          {config.heroSubheadline}
        </p>
        <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-3xl mx-auto">
          {config.heroDescription}
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <a href="#hire-form" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-1 w-full sm:w-auto text-center">
            Hire {config.name} Developers
          </a>
          <a href="#get-quote" className="px-8 py-4 bg-transparent border border-slate-600 hover:border-slate-400 text-white rounded-full font-semibold transition-all w-full sm:w-auto text-center">
            Get a Quote
          </a>
        </div>
      </div>
    </section>
  );
};
