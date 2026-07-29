import React from "react";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { getHireTechnologyConfig, hireTechnologies } from "@/config/hire";
import { HeroSection } from "@/components/modules/hire/HeroSection";
import { BenefitsSection } from "@/components/modules/hire/BenefitsSection";
import { ProcessSection } from "@/components/modules/hire/ProcessSection";
import { PricingSection } from "@/components/modules/hire/PricingSection";
import { FAQSection } from "@/components/modules/hire/FAQSection";
import { HireDeveloperForm } from "@/components/modules/hire/HireDeveloperForm";
import { GetQuoteForm } from "@/components/modules/hire/GetQuoteForm";

export async function generateMetadata({ params }: { params: { technology: string } }) {
  const config = getHireTechnologyConfig(params.technology);
  if (!config) {
    return { title: "Technology Not Found" };
  }
  return {
    title: config.metaTitle,
    description: config.metaDescription,
  };
}

export function generateStaticParams() {
  return Object.keys(hireTechnologies).map((tech) => ({
    technology: tech,
  }));
}

export default function HireTechnologyPage({ params }: { params: { technology: string } }) {
  const config = getHireTechnologyConfig(params.technology);

  if (!config) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white">
      <HeroSection config={config} />
      
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="prose prose-lg prose-indigo mx-auto" dangerouslySetInnerHTML={{ __html: marked.parse(config.aboutContent) as string }} />
        </div>
      </section>

      <BenefitsSection config={config} />
      <ProcessSection config={config} />
      <PricingSection config={config} />
      
      <section className="py-24 bg-slate-900 text-white relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to Build with {config.name}?</h2>
            <p className="text-xl text-slate-400">Fill out the form below and we'll connect you with the perfect developer.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl mx-auto">
            <div className="lg:col-span-7">
              <HireDeveloperForm config={config} />
            </div>
            <div className="lg:col-span-5">
              <GetQuoteForm />
            </div>
          </div>
        </div>
      </section>

      <FAQSection config={config} />
    </main>
  );
}
