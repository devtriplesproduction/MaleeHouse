import React from "react";
import { HireTechnologyConfig } from "@/types/hire-technology";
import { 
  Zap, Layers, Users, Search, Plug, BarChart, Activity, Smile, TrendingUp,
  Smartphone, PenTool, Clock, Layout, UserPlus, Code, Shield, UploadCloud,
  Map, CheckCircle, CloudLightning, DollarSign, Lock, Eye, Clipboard, UserCheck, Edit, Bug, FileText
} from "lucide-react";

interface BenefitsSectionProps {
  config: HireTechnologyConfig;
}

const getIcon = (name?: string) => {
  const icons: Record<string, any> = {
    "zap": Zap, "layers": Layers, "users": Users, "search": Search, "plug": Plug,
    "bar-chart": BarChart, "activity": Activity, "smile": Smile, "trending-up": TrendingUp,
    "smartphone": Smartphone, "pen-tool": PenTool, "clock": Clock, "layout": Layout,
    "user-plus": UserPlus, "code": Code, "shield": Shield, "upload-cloud": UploadCloud,
    "map": Map, "check-circle": CheckCircle, "cloud-lightning": CloudLightning,
    "dollar-sign": DollarSign, "lock": Lock, "eye": Eye, "clipboard": Clipboard,
    "user-check": UserCheck, "edit": Edit, "bug": Bug, "file-text": FileText
  };
  const IconComponent = icons[name || ""] || CheckCircle;
  return <IconComponent className="w-8 h-8 text-indigo-600" />;
};

export const BenefitsSection: React.FC<BenefitsSectionProps> = ({ config }) => {
  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Benefits of Hiring {config.name} Developers</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">Discover how our {config.name} experts can add immediate value to your project.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {config.benefits.map((benefit, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-6">
                {getIcon(benefit.icon)}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{benefit.title}</h3>
              <p className="text-slate-600 leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
