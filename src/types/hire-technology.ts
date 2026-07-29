export interface HireFAQ {
  question: string;
  answer: string;
}

export interface HireProcessStep {
  title: string;
  description: string;
  icon?: string;
}

export interface HireBenefit {
  title: string;
  description: string;
  icon?: string;
}

export interface HirePricing {
  hourly: string;
  monthly: string;
  dedicated: string;
  description: string;
}

export interface HireTechnologyConfig {
  id: string;
  name: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroDescription: string;
  aboutContent: string;
  benefits: HireBenefit[];
  process: HireProcessStep[];
  pricing: HirePricing;
  faqs: HireFAQ[];
  metaTitle: string;
  metaDescription: string;
}
