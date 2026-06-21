'use client';

import React, { useState } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail,
  Layers,
  Plus,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Globe,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createProjectSchema, type CreateProjectInput } from '@/validations/project.schema';
import { createProjectAction } from '@/actions/project.actions';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/hooks/useUser';

type ProjectFormValues = CreateProjectInput;

const STEPS = [
  { id: 1, title: 'Customer & Site', description: 'Core details & location', icon: Building2 },
  { id: 2, title: 'Survey Services', description: 'Select services & categories', icon: Layers },
  { id: 3, title: 'Review & Create', description: 'Confirm & save project', icon: ShieldCheck },
];

const SERVICES_BY_CATEGORY: Record<string, string[]> = {
  "Plot measurement": [
    "Farm measurement",
    "Forest measurement",
    "Farm contour",
    "Farm dividation"
  ],
  "Bridge survey": [
    "New Bridge",
    "CD Work",
    "Box Culvert",
    "Slab Culvert",
    "Minor Bridge",
    "Major Bridge",
    "Existing Bridge"
  ],
  "Bandara": [
    "Bandara",
    "KT WEIR"
  ],
  "DAM/ Pazar Talav/ MI Tank": [
    "Dam & Mi Tank",
    "Pazar Talav",
    "1-FSL Line Marking",
    "2-L Section, Cross Section, Existing Line"
  ],
  "Canal Survey": [
    "Main Line",
    "DY",
    "Minor",
    "Sub Minor"
  ],
  "Pipeline Survey": [
    "Command area survey",
    "Existing PDN Survey",
    "New Alignment Survey",
    "Rising Main (command + area)"
  ],
  "Road Survey": [
    "Road survey Existing Road",
    "NH,SH",
    "MDR,ODR,VR",
    "Road Survey New alignment",
    "Hamp road survey"
  ],
  "GIS survey": [
    "Drone Photogrammetric Survey",
    "LIDAR Survey"
  ]
};

export function ProjectCreationWizard() {
  const { role } = useUser();
  const isSales = false; // Force indigo/blue theme for all roles as requested
  const c = {
    bg: 'bg-indigo-600',
    hoverBg: 'hover:bg-indigo-700',
    hoverBgLight: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/20',
    bgLight: 'bg-indigo-50 dark:bg-indigo-500/10',
    shadow: 'shadow-indigo-550/20',
    shadowMd: 'shadow-indigo-500/10',
    stepActive: 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30',
    focusWithin: 'group-focus-within:text-indigo-500',
    focusBorder: 'focus:border-indigo-500',
    focusRing: 'focus:ring-indigo-500/10',
    glow: 'bg-indigo-500/10',
    alertBg: 'bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/20',
    alertIconBg: 'bg-indigo-600',
  };

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [activeCategory, setActiveCategory] = useState<string>("Plot measurement");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<ProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      client_name: '',
      phone: '',
      email: '',
      client_address: '',
      site_type: 'residential',
      survey_requirements: '',
      services: [],
    },
    mode: 'onChange',
  });

  const { handleSubmit, formState: { errors }, watch, setValue, trigger } = methods;

  const selectedServices = watch('services') || [];

  const handleNext = async () => {
    let fieldsToValidate: (keyof ProjectFormValues)[] = [];
    if (step === 1) {
      fieldsToValidate = ['name', 'client_name', 'phone', 'email', 'client_address', 'site_type', 'survey_requirements'];
    } else if (step === 2) {
      fieldsToValidate = ['services'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => setStep((s) => s - 1);

  const onSubmit = async (data: ProjectFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createProjectAction(data);
      if (result?.success) {
        toast.success('Project Created Successfully', {
          description: 'The new project record and survey workflow have been initialized.',
        });
        setOpen(false);
        setStep(1);
        methods.reset();
      } else {
        toast.error('Unable to Create Project', {
          description: result?.error || 'The system was unable to save the new project.',
        });
      }
    } catch (err) {
      toast.error('System Failure', {
        description: 'Failed to communicate with the server database.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) {
        setStep(1);
        methods.reset();
      }
    }}>
      <DialogTrigger asChild>
        <button 
          id="btn-establish-project"
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 text-white rounded-2xl font-bold uppercase tracking-wider text-sm transition-all shadow-lg active:scale-95 group",
            c.bg, c.hoverBg, c.shadow
          )}
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          Add Project
        </button>
      </DialogTrigger>
      
      <DialogContent className="max-w-5xl h-[85vh] !p-0 !overflow-hidden !border-none !bg-transparent !shadow-none sm:!rounded-none [&>button]:hidden">
        <div className="w-full h-full flex bg-white/95 dark:bg-[#0c101f]/95 backdrop-blur-2xl rounded-[3rem] border border-slate-200/80 dark:border-white/10 overflow-hidden relative shadow-2xl font-sans">
          
          {/* ── Left Sidebar Flow ── */}
          <div className="w-96 bg-slate-50/50 dark:bg-[#080b14]/50 border-r border-slate-200/80 dark:border-white/5 flex flex-col justify-between p-10 shrink-0 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className={cn("absolute -top-24 -left-24 w-48 h-48 blur-[60px] rounded-full pointer-events-none", c.glow)} />
            <div className={cn("absolute -bottom-24 -right-24 w-48 h-48 blur-[60px] rounded-full pointer-events-none", c.glow)} />
            
            <div className="space-y-10 relative z-10">
              {/* Header Title */}
              <div className="space-y-4">
                <div className={cn("flex items-center gap-2 px-4 py-2 rounded-xl border w-max", c.bgLight, c.border)}>
                  <Building2 className={cn("w-4 h-4", c.text)} />
                  <span className={cn("text-sm font-bold uppercase tracking-widest", c.text)}>Setup Wizard</span>
                </div>
                <h4 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight">New Project</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Setup customer details, site category, and required field services.</p>
              </div>

              {/* Steps Progress List */}
              <div className="space-y-6">
                {STEPS.map((s) => {
                  const isActive = step === s.id;
                  const isCompleted = step > s.id;
                  return (
                    <div key={s.id} className="flex items-start gap-5">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 border shrink-0",
                        isActive ? c.stepActive :
                        isCompleted ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20" : 
                        "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500"
                      )}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5 text-white" /> : <span>0{s.id}</span>}
                      </div>
                      <div className="pt-0.5">
                        <p className={cn(
                          "text-sm font-bold uppercase tracking-widest leading-none mb-1.5",
                          isActive ? c.text : isCompleted ? "text-emerald-500 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
                        )}>Step {s.id}</p>
                        <p className={cn("text-base font-bold transition-colors", isActive ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400")}>{s.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-tight">{s.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>


          </div>

          {/* ── Right Content Area ── */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white/50 dark:bg-[#0c101f]/50">
            
            {/* Form Fields */}
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <FormProvider {...methods}>
                <form 
                  id="wizard-form" 
                  onSubmit={handleSubmit(onSubmit)} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
                      e.preventDefault();
                    }
                  }}
                  className="max-w-2xl mx-auto space-y-8"
                >
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={step}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-8"
                    >
                      {/* Step Header */}
                      <div className="flex items-end justify-between">
                        <div className="space-y-1">
                          <span className={cn("text-sm font-bold px-3 py-1.5 rounded-full uppercase tracking-wider", c.bgLight, c.text)}>
                            Step {step} of 3
                          </span>
                          <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight pt-2 leading-none">
                            {STEPS.find((s: any) => s.id === step)?.title}
                          </h3>
                        </div>
                        {step === 2 && (
                          <span className={cn("text-sm font-bold px-3 py-1.5 rounded-full shrink-0 mb-1", c.bgLight, c.text)}>
                            {selectedServices.length} Selected
                          </span>
                        )}
                      </div>

                      {/* STEP 1: Customer & Site Details */}
                      {step === 1 && (
                        <div className="space-y-6">
                          
                          {/* Project Name & Client Entity */}
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label htmlFor="input-name" className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block px-1">
                                Project Name
                              </label>
                              <div className="relative group">
                                <Building2 className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors z-10 shrink-0", c.focusWithin)} />
                                <input 
                                  id="input-name"
                                  {...methods.register('name')} 
                                  placeholder="e.g. Pune Highway Survey" 
                                  className={cn("glass-input h-14 !pl-12 font-bold text-sm placeholder:font-medium placeholder:text-slate-400/70", c.focusBorder, c.focusRing)} 
                                />
                              </div>
                              {errors.name && <p className="text-xs font-bold text-rose-500 uppercase tracking-wide px-1">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-2">
                              <label htmlFor="input-client" className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block px-1">
                                Client / Company Name
                              </label>
                              <div className="relative group">
                                 <Globe className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors z-10 shrink-0", c.focusWithin)} />
                                 <input 
                                   id="input-client"
                                   {...methods.register('client_name')} 
                                   placeholder="Individual or Company" 
                                   className={cn("glass-input h-14 !pl-12 font-bold text-sm placeholder:font-medium placeholder:text-slate-400/70", c.focusBorder, c.focusRing)} 
                                 />
                              </div>
                              {errors.client_name && <p className="text-xs font-bold text-rose-500 uppercase tracking-wide px-1">{errors.client_name.message}</p>}
                            </div>
                          </div>

                          {/* Contact Phone & Email */}
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label htmlFor="input-phone" className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block px-1">
                                Primary Contact (Phone)
                              </label>
                              <div className={cn("relative group phone-input-container glass-input h-14 !p-0 flex items-center transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 dark:focus-within:ring-indigo-500/5")}>
                                 <Phone className={cn("absolute left-4 w-4 h-4 text-slate-400 transition-colors z-10 shrink-0 group-focus-within:text-indigo-500")} />
                                 <Controller
                                   name="phone"
                                   control={methods.control}
                                   render={({ field }) => (
                                     <PhoneInput
                                       {...field}
                                       id="input-phone"
                                       placeholder="+91 98765 43210"
                                       defaultCountry="IN"
                                       international
                                       countryCallingCodeEditable={false}
                                       limitMaxLength={true}
                                       maxLength={15}
                                       className="w-full h-full font-bold text-sm"
                                     />
                                   )}
                                 />
                                 <style jsx global>{`
                                   .phone-input-container .PhoneInput {
                                     display: flex;
                                     align-items: center;
                                     width: 100%;
                                     height: 100%;
                                   }
                                   .phone-input-container .PhoneInputInput {
                                     background: transparent;
                                     border: none;
                                     outline: none;
                                     font-weight: bold;
                                     font-size: 0.875rem;
                                     color: inherit;
                                     width: 100%;
                                     height: 100%;
                                     padding-right: 1rem;
                                   }
                                   .phone-input-container .PhoneInputInput::placeholder {
                                     font-weight: 500;
                                     color: rgb(148 163 184 / 0.7);
                                   }
                                   .phone-input-container .PhoneInputCountry {
                                     margin-left: 2.75rem;
                                     margin-right: 0.5rem;
                                   }
                                   .phone-input-container .PhoneInputCountryIcon {
                                     display: none !important;
                                   }
                                 `}</style>
                              </div>
                              {errors.phone && <p className="text-xs font-bold text-rose-500 uppercase tracking-wide px-1">{errors.phone.message}</p>}
                            </div>

                            <div className="space-y-2">
                              <label htmlFor="input-email" className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block px-1">
                                Email Address
                              </label>
                              <div className="relative group">
                                 <Mail className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors z-10 shrink-0", c.focusWithin)} />
                                 <input 
                                   id="input-email"
                                   {...methods.register('email')} 
                                   placeholder="client@example.com" 
                                   className={cn("glass-input h-14 !pl-12 font-bold text-sm placeholder:font-medium placeholder:text-slate-400/70", c.focusBorder, c.focusRing)} 
                                 />
                              </div>
                              {errors.email && <p className="text-xs font-bold text-rose-500 uppercase tracking-wide px-1">{errors.email.message}</p>}
                            </div>
                          </div>

                          {/* Site Typology Redesigned Dropdown */}
                          <div className="space-y-2">
                            <label htmlFor="input-site-type" className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-50 block px-1">
                              Site Typology
                            </label>
                            <select 
                              id="input-site-type"
                              {...methods.register('site_type')}
                              className={cn(
                                "glass-input h-14 px-4 font-bold text-sm cursor-pointer w-full",
                                c.focusBorder, c.focusRing
                              )}
                            >
                              <option value="residential" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Residential Site Selection</option>
                              <option value="commercial" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Commercial Development Site</option>
                              <option value="industrial" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Industrial Complex Site</option>
                              <option value="infrastructure" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Infrastructure Route / Utility Site</option>
                              <option value="other" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Other / Custom Survey Land</option>
                            </select>
                            {errors.site_type && <p className="text-xs font-bold text-rose-500 uppercase tracking-wide px-1">{errors.site_type.message}</p>}
                          </div>

                          {/* Site/Office Address */}
                          <div className="space-y-2">
                            <label htmlFor="textarea-address" className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-550 block px-1">
                              Site Address
                            </label>
                            <div className="relative group">
                                <MapPin className={cn("absolute left-4 top-5 w-4 h-4 text-slate-400 transition-colors z-10 shrink-0", c.focusWithin)} />
                                <textarea 
                                  id="textarea-address"
                                  {...methods.register('client_address')} 
                                  placeholder="Enter the complete site location address..." 
                                  className={cn("glass-input min-h-[90px] py-4 !pl-12 resize-none font-bold text-sm leading-relaxed placeholder:font-medium placeholder:text-slate-400/70", c.focusBorder, c.focusRing)} 
                                />
                            </div>
                            {errors.client_address && <p className="text-xs font-bold text-rose-500 uppercase tracking-wide px-1">{errors.client_address.message}</p>}
                          </div>

                          {/* Technical Scope Requirements */}
                          <div className="space-y-2">
                            <label htmlFor="textarea-reqs" className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block px-1">
                              Technical Scope Requirements
                            </label>
                            <textarea 
                              id="textarea-reqs"
                              {...methods.register('survey_requirements')}
                              rows={4} 
                              placeholder="Detail critical survey requirements, specific limits, or land conditions..."
                              className={cn("glass-input py-4 px-5 min-h-[100px] text-sm leading-relaxed resize-none font-bold placeholder:font-medium placeholder:text-slate-400/70", c.focusBorder, c.focusRing)}
                            />
                            {errors.survey_requirements && <p className="text-xs font-bold text-rose-500 uppercase tracking-wide px-1">{errors.survey_requirements.message}</p>}
                          </div>

                        </div>
                      )}

                      {/* STEP 2: Survey Services Selection */}
                      {step === 2 && (
                        <div className="space-y-6">
                          {/* Two Column Layout: Categories Left, Sub-categories Right */}
                          <div className="flex gap-6 h-[400px] items-stretch">
                            {/* Categories List (Left) */}
                            <div className="w-56 overflow-y-auto space-y-1.5 pr-2 border-r border-slate-200 dark:border-white/5 custom-scrollbar shrink-0">
                              {Object.keys(SERVICES_BY_CATEGORY).map((cat) => {
                                const isCurrent = activeCategory === cat;
                                const countInCat = SERVICES_BY_CATEGORY[cat].filter((s: any) => selectedServices.includes(s)).length;
                                return (
                                  <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setActiveCategory(cat)}
                                    className={cn(
                                      "w-full text-left px-4 py-3.5 rounded-xl text-xs font-bold tracking-tight transition-all flex items-center justify-between group",
                                      isCurrent 
                                        ? cn(c.bg, "text-white shadow-md", c.shadowMd) 
                                        : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-450"
                                    )}
                                  >
                                    <span className="truncate pr-1">{cat}</span>
                                    {countInCat > 0 && (
                                      <span className={cn(
                                        "text-xs font-bold px-2 py-0.5 rounded-full shrink-0",
                                        isCurrent ? "bg-white text-indigo-600" : cn(c.bgLight, c.text)
                                      )}>
                                        {countInCat}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Sub-categories Grid (Right) */}
                            <div className="flex-1 overflow-y-auto pl-2 pr-1 custom-scrollbar space-y-4">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                {activeCategory} Services
                              </h4>
                              
                              <div className="grid grid-cols-1 gap-3">
                                {SERVICES_BY_CATEGORY[activeCategory].map((subCat) => {
                                  const isSelected = selectedServices.includes(subCat);
                                  return (
                                    <button
                                      key={subCat}
                                      type="button"
                                      onClick={() => {
                                        const current = selectedServices;
                                        const next = current.includes(subCat)
                                          ? current.filter((s: any) => s !== subCat)
                                          : [...current, subCat];
                                        setValue('services', next, { shouldValidate: true });
                                      }}
                                      className={cn(
                                        "w-full flex items-center justify-between p-4 rounded-xl border text-xs font-bold text-left transition-all duration-200 group relative",
                                        isSelected 
                                          ? cn(c.bg, "border-transparent text-white shadow-md", c.shadowMd) 
                                          : cn("bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-350", "hover:border-indigo-500/40")
                                      )}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={cn(
                                          "w-7 h-7 rounded-lg flex items-center justify-center border transition-all shrink-0",
                                          isSelected ? "bg-white/20 border-white/30" : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
                                        )}>
                                          <Settings className={cn("w-3.5 h-3.5", isSelected && "animate-spin-slow")} />
                                        </div>
                                        <span className="tracking-tight leading-snug">{subCat}</span>
                                      </div>
                                      
                                      <div className={cn(
                                        "w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0",
                                        isSelected 
                                          ? "bg-white border-white text-indigo-600 scale-105" 
                                          : "border-slate-300 dark:border-white/20 group-hover:scale-105"
                                      )}>
                                        {isSelected && <CheckCircle2 className={cn("w-3.5 h-3.5 fill-white", c.text)} />}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {errors.services && <p className="text-xs font-bold text-rose-500 uppercase tracking-wide px-1">{errors.services.message}</p>}
                        </div>
                      )}

                      {/* STEP 3: Review & Finalize */}
                      {step === 3 && (
                        <div className="space-y-6">
                          
                          {/* Premium Recap Card in Liquid Glass theme */}
                          <div className="glass-card bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 rounded-3xl p-8 space-y-6 relative overflow-hidden shadow-xl">
                            <div className={cn("absolute top-0 right-0 w-48 h-48 blur-[80px] rounded-full pointer-events-none", c.glow)} />
                            
                            <div className="border-b border-slate-200/60 dark:border-white/5 pb-5">
                               <p className={cn("text-xs font-bold uppercase tracking-widest mb-1", c.text)}>Project Name</p>
                               <h4 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">{watch('name')}</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-6 text-slate-600 dark:text-slate-300">
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Client Name</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">{watch('client_name')}</p>
                              </div>

                              <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Contact Phone</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">{watch('phone')}</p>
                              </div>

                              <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Email Address</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">{watch('email') || 'Not provided'}</p>
                              </div>

                              <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Site Type</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-white capitalize">{watch('site_type')}</p>
                              </div>
                            </div>

                            <div className="border-t border-slate-200/60 dark:border-white/5 pt-4 space-y-1">
                              <p className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Site Location Address</p>
                              <p className="text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-200">{watch('client_address')}</p>
                            </div>

                            <div className="border-t border-slate-200/60 dark:border-white/5 pt-4 space-y-2">
                              <p className="text-xs font-bold text-slate-400 dark:text-slate-555 uppercase tracking-widest">Selected Services ({selectedServices.length})</p>
                              <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto custom-scrollbar">
                                {selectedServices.map((srv) => (
                                  <span key={srv} className="text-xs font-bold bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2.5 py-1 rounded-lg text-slate-850 dark:text-white">
                                    {srv}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className={cn("p-6 rounded-2xl border flex items-center justify-between group overflow-hidden relative", c.alertBg)}>
                            <div className="flex items-center gap-4 relative z-10">
                              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white", c.alertIconBg)}>
                                <CheckCircle2 className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">Everything is Set</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Please review all values. Clicking below will initialize the project record.</p>
                              </div>
                            </div>
                          </div>

                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </form>
              </FormProvider>
            </div>

            {/* ── Bottom Navigation Action Bar ── */}
            <div className="h-20 px-8 border-t border-slate-200 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-white/[0.01] backdrop-blur-xl shrink-0">
              <button
                key="btn-wizard-back"
                type="button"
                id="btn-wizard-back"
                onClick={step === 1 ? () => setOpen(false) : handleBack}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all outline-none"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {step === 1 ? 'Cancel' : 'Back'}
              </button>

              {step < 3 ? (
                <button
                  key="btn-wizard-next"
                  type="button"
                  id="btn-wizard-next"
                  onClick={handleNext}
                  className={cn(
                    "flex items-center gap-3 px-8 py-3 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:shadow-lg active:scale-[0.97] transition-all group outline-none",
                    c.bg, c.hoverBg, c.shadow
                  )}
                >
                  Continue
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <button
                  key="btn-wizard-submit"
                  type="submit"
                  form="wizard-form"
                  id="btn-wizard-submit"
                  disabled={isSubmitting}
                  className={cn(
                    "flex items-center gap-3 px-8 py-3 text-white rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] transition-all group outline-none",
                    c.bg, c.hoverBg, c.shadow
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Project
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
