"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  X, UserPlus, Mail, User, ShieldCheck, Loader2, Lock, 
  Phone, Contact, Building2, Briefcase, MapPin, 
  CheckCircle2, Copy, ChevronRight, ChevronLeft, ChevronDown, Calendar,
  Upload, FileText, Trash2, Award, ShieldAlert, BadgeInfo,
  IndianRupee, Clock, Check, UserCheck, Camera, Eye, EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { onboardEmployeeAction } from "@/actions/admin.actions";
import { useToast } from "@/hooks/use-toast";
import { onboardSchema, type OnboardFormData } from "@/lib/validations/onboard";
import { DEPARTMENTS, getDesignationsForDepartment, getSystemRoleForDesignation } from "@/config/departments";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { FormSelect } from "@/components/ui/FormSelect";
import { useSidebarStore } from "@/store/useSidebarStore";
import { PremiumDatePicker } from "@/components/ui/PremiumDatePicker";

interface OnboardUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingUsers?: any[];
  onSuccess?: () => void;
}

export function OnboardUserModal({ isOpen, onClose, existingUsers = [], onSuccess }: OnboardUserModalProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [provisionedCreds, setProvisionedCreds] = useState<{ email: string; pass: string; id: string } | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showStep4Errors, setShowStep4Errors] = useState(false);
  
  const { toast } = useToast();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 2MB",
          variant: "error"
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setSelectedAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    control,
    formState: { errors, isSubmitted },
    reset
  } = useForm<OnboardFormData>({
    resolver: zodResolver(onboardSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      dob: "",
      phone_number: "",
      personal_email: "",
      address: "",
      emergency_contact: "",
      department: "",
      designation: "",
      gender: "male",
      employment_type: "full-time",
      salary: 0,
      experience: 0,
      location: "office",
      role: "employee",
      status: "active",
      joining_date: new Date().toISOString().split('T')[0],
      department_head: false,
      reporting_manager: "",
      email: "",
      employee_id: "",
      password: "",
      confirm_password: "",
    }
  });

  const firstName = watch("first_name");
  const lastName = watch("last_name");
  const selectedDept = watch("department");
  const selectedDesignation = watch("designation");

  const phoneNumber = watch("phone_number");

  // Auto-generate employee ID based on phone number
  useEffect(() => {
    if (phoneNumber) {
      const digits = phoneNumber.replace(/\D/g, '');
      if (digits.length >= 5) {
        const last5 = digits.slice(-5);
        setValue("employee_id", `EMP-${last5}`);
      } else {
        setValue("employee_id", `EMP-${digits.padEnd(5, '0')}`);
      }
    } else if (isOpen) {
      setValue("employee_id", `EMP-${Math.floor(10000 + Math.random() * 90000)}`); // Fallback if no phone
    }
  }, [phoneNumber, isOpen, setValue]);

  // Manually register fields that don't have native inputs
  useEffect(() => {
    register("department");
    register("designation");
    register("joining_date");
  }, [register]);

  // Handle department designation mapping to ERP role
  useEffect(() => {
    if (selectedDept && selectedDesignation) {
      const mappedRole = getSystemRoleForDesignation(selectedDept, selectedDesignation);
      setValue("role", mappedRole);
    }
  }, [selectedDept, selectedDesignation, setValue]);

  // Reset designation if department changes
  useEffect(() => {
    if (selectedDept) {
      const designations = getDesignationsForDepartment(selectedDept);
      if (designations.length > 0) {
        setValue("designation", designations[0].id);
      }
    }
  }, [selectedDept, setValue]);

  if (!isOpen) return null;

  const nextStep = async () => {
    let fieldsToValidate: (keyof OnboardFormData)[] = [];
    if (step === 1) {
      fieldsToValidate = ["first_name", "last_name", "dob", "gender", "phone_number", "personal_email", "address", "emergency_contact"];
    } else if (step === 2) {
      fieldsToValidate = ["department", "designation", "employment_type", "salary", "experience", "joining_date"];
    } else if (step === 3) {
      // Step 3 is document uploading, no sync validations required
      setStep(4);
      return;
    }
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    } else {
      toast({
        title: "Validation Check Failed",
        description: "Please fill in all required fields correctly before moving forward.",
        variant: "error"
      });
    }
  };

  const prevStep = () => setStep(step - 1);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: any) => {
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const reader = new FileReader();
      reader.onloadend = () => {
        const newFileObj = {
          id: fileId,
          name: file.name,
          label: "",
          size: file.size,
          uploaded_at: new Date().toISOString(),
          url: reader.result as string
        };
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
        setUploadedFiles(prev => [...prev, newFileObj]);
        let progress = 0;
        const interval = setInterval(() => {
          progress += 20;
          setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
          if (progress >= 100) {
            clearInterval(interval);
            toast({ title: "Document Registered", description: `${file.name} staged successfully.`, variant: "success" });
          }
        }, 100);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter((f: any) => f.id !== id));
    toast({
      title: "Document Removed",
      description: "Staged document successfully deleted."
    });
  };

  const handleDocumentNameChange = (id: string, newName: string) => {
    setUploadedFiles(prev => prev.map((f: any) => f.id === id ? { ...f, label: newName } : f));
  };

  const onSubmit = async (data: OnboardFormData) => {
    setIsSubmitting(true);
    try {
      const onboardData = {
        ...data,
        profile_photo: selectedAvatar,
        reporting_manager_id: data.reporting_manager || null,
        department_head_id: data.department_head ? data.reporting_manager || null : null,
        approval_authority: data.role === "admin",
        branch: "Malee House HQ",
        office_location: "Singapore",
        operational_zone: "Central Business District"
      };
      
      const result = await onboardEmployeeAction(onboardData as any, uploadedFiles);
      if (result?.success) {
        toast({ 
          title: "Employee Provisioned Successfully", 
          description: `Internal structures set up for ${data.first_name}.`, 
          variant: "success" 
        });
        setProvisionedCreds({ 
          email: data.email, 
          pass: data.password,
          id: (result.data as any)?.employee_id || data.employee_id
        });
        if (onSuccess) onSuccess();
      } else {
        if (typeof window !== 'undefined') {
          window.alert(`Provisioning Action Denied:\n\n${result?.error}`);
        }
        toast({ 
          title: "Provisioning Action Denied", 
          description: result?.error, 
          variant: "error" 
        });
      }
    } catch (err: any) {
      console.error(err);
      if (typeof window !== 'undefined') {
        window.alert(`Transaction Failure:\n\nAn unexpected network or file engine error occurred. ${err?.message || ''}`);
      }
      toast({ 
        title: "Transaction Failure", 
        description: "An unexpected network or file engine error occurred.", 
        variant: "error" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    
    // Auto-navigate to the step with the error
    if (errors.first_name || errors.last_name || errors.dob || errors.gender || errors.phone_number || errors.personal_email || errors.address || errors.emergency_contact) {
      setStep(1);
    } else if (errors.department || errors.designation || errors.employment_type || errors.salary || errors.experience || errors.joining_date) {
      setStep(2);
    } else if (errors.email || errors.role || errors.employee_id || errors.status || errors.password || errors.confirm_password) {
      setStep(4);
    }

    const errorMessages = Object.entries(errors)
      .map(([key, err]: [string, any]) => `${key}: ${err.message}`)
      .join('\n');
      
    // Loud alert to guarantee visibility of errors
    if (typeof window !== 'undefined') {
      window.alert(`Validation Check Failed:\n\n${errorMessages || "Please fill all required fields."}`);
    }

    toast({
      title: "Validation Check Failed",
      description: errorMessages || "Please fill all required fields.",
      variant: "error"
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ 
      title: "Copied to Clipboard", 
      description: "Sensitive credential copied safely to clipboard buffer.",
      variant: "success" 
    });
  };

  const handleClose = () => {
    reset();
    setStep(1);
    setProvisionedCreds(null);
    setUploadedFiles([]);
    setShowStep4Errors(false);
    onClose();
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-[#020408]/80 backdrop-blur-2xl animate-in fade-in duration-300" />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#080b14] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-8">
        
        {provisionedCreds ? (
          <div className="p-8 md:p-12 space-y-8 text-center bg-gradient-to-b from-indigo-50/50 to-white dark:from-indigo-950/10 dark:to-transparent">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto animate-bounce">
              <UserCheck className="w-10 h-10 text-emerald-500" />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Account Provisioned</h3>
              <p className="text-slate-500 dark:text-slate-400 font-semibold max-w-md mx-auto text-sm">
                Employee record for <span className="text-indigo-600 dark:text-indigo-400">{firstName} {lastName}</span> was successfully provisioned.
              </p>
            </div>

            <div className="grid gap-4 max-w-md mx-auto text-left">
              <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between group shadow-sm">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Employee ID</p>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">{provisionedCreds.id}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between group shadow-sm">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Username / Work Email</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">{provisionedCreds.email}</p>
                </div>
                <button 
                  onClick={() => copyToClipboard(provisionedCreds.email)} 
                  className="p-2.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all"
                  title="Copy work email"
                >
                  <Copy className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between group shadow-sm">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Password</p>
                  <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-lg tracking-wider mt-0.5">
                    {provisionedCreds.pass}
                  </p>
                </div>
                <button 
                  onClick={() => copyToClipboard(provisionedCreds.pass)} 
                  className="p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl transition-all"
                  title="Copy password"
                >
                  <Copy className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </button>
              </div>
            </div>

            <Button 
              onClick={handleClose} 
              variant="hr"
              className="w-full max-w-md h-12 text-xs font-bold uppercase tracking-wider"
            >
              Complete & Close Wizard
            </Button>
          </div>
        ) : (
          <form 
            onSubmit={handleSubmit(onSubmit, onError)} 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                e.preventDefault();
              }
            }}
            className="flex flex-col h-[750px] max-h-[90vh]"
          >

            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/40 dark:bg-[#0a0d16]">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Create Employee Profile
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">
                  Enterprise Unified Provisioning - Step {step} of 4
                </p>
              </div>
              <button 
                type="button" 
                onClick={handleClose} 
                className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Progress Bar Tabs (Layout matching screenshots exactly) */}
            <div className="px-8 py-4 bg-slate-100/30 dark:bg-white/[0.005] border-b border-slate-100 dark:border-white/5 grid grid-cols-4 gap-4">
              {[
                { label: "PERSONAL INFO", step: 1 },
                { label: "PROFESSIONAL", step: 2 },
                { label: "DOCUMENTS", step: 3 },
                { label: "LOGIN DETAILS", step: 4 },
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={async () => {
                    if (s.step < step) setStep(s.step);
                    else if (s.step === step + 1) await nextStep();
                  }}
                  className="flex flex-col text-left outline-none group w-full"
                >
                  <div className={cn(
                    "h-[3px] w-full rounded-full transition-all duration-500", 
                    step >= s.step 
                      ? "bg-indigo-600 hover:bg-indigo-700 dark:bg-[#a78bfa]" 
                      : "bg-slate-200 dark:bg-white/10 group-hover:bg-slate-300 dark:group-hover:bg-white/20"
                  )} />
                  <span className={cn(
                    "text-xs font-bold tracking-wider mt-2.5 transition-colors ",
                    step >= s.step 
                      ? "text-indigo-600 dark:text-indigo-400" 
                      : "text-slate-400 dark:text-slate-600"
                  )}>
                    {s.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-5 custom-scrollbar bg-white dark:bg-[#080b14]">
              
              {/* STEP 1: PERSONAL INFO */}
              {step === 1 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-slate-50/20 dark:bg-white/[0.01] p-5 rounded-2xl border border-slate-100 dark:border-white/5 backdrop-blur-md">
                    {/* Dotted Photo Upload/Placeholder Block */}
                    <div className="flex flex-col items-center shrink-0">
                      <input 
                        type="file"
                        id="profile-photo-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                      <div 
                        onClick={() => document.getElementById("profile-photo-upload")?.click()}
                        className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/15 flex flex-col items-center justify-center bg-slate-500/[0.03] dark:bg-white/[0.01] hover:border-indigo-600 dark:hover:border-[#a78bfa] transition-all group overflow-hidden cursor-pointer shadow-sm"
                      >
                        {selectedAvatar ? (
                          <img 
                            src={selectedAvatar} 
                            alt="Avatar Preview" 
                            className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform" 
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-[#a78bfa] transition-colors p-2 text-center">
                            <Camera className="w-6 h-6 mb-1 text-slate-400 dark:text-slate-500" />
                            <span className="text-xs font-bold uppercase tracking-wider">Upload Photo</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-xs font-bold">
                          <Camera className="w-4 h-4 mb-0.5" />
                          {selectedAvatar ? "CHANGE" : "UPLOAD"}
                        </div>
                      </div>
                      <span className="text-xs font-bold tracking-widest text-slate-400 mt-2">PHOTO</span>
                    </div>

                    {/* Profile Photo Upload Header */}
                    <div className="flex-1 space-y-1 w-full sm:pt-1 text-left">
                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                        <User className="w-4 h-4" />
                        <h4 className="text-sm font-bold tracking-tight text-slate-800 dark:text-white">Profile Photo Upload</h4>
                      </div>
                      <p className="text-sm text-slate-400 dark:text-slate-500 leading-relaxed font-semibold">
                        Upload a professional portrait (JPG, PNG. Max 2MB).
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">First Name *</label>
                      <input 
                        {...register("first_name")} 
                        placeholder="John" 
                        className="w-full px-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all" 
                      />
                      {errors.first_name && <p className="text-xs text-rose-500 font-bold mt-1">{errors.first_name.message}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Last Name *</label>
                      <input 
                        {...register("last_name")} 
                        placeholder="Doe" 
                        className="w-full px-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all" 
                      />
                      {errors.last_name && <p className="text-xs text-rose-500 font-bold mt-1">{errors.last_name.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Date of Birth</label>
                      <PremiumDatePicker
                        value={watch("dob")}
                        onChange={(date) => setValue("dob", date, { shouldValidate: true })}
                        side="right"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Gender</label>
                      <div className="relative">
                        <FormSelect
                          name="gender"
                          control={control}
                          options={[
                            { value: "male", label: "Male" },
                            { value: "female", label: "Female" },
                            { value: "other", label: "Other" }
                          ]}
                          buttonClassName="w-full px-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Phone Number</label>
                      <input 
                        {...register("phone_number")} 
                        type="tel"
                        maxLength={10}
                        onInput={(e) => {
                          e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '');
                        }}
                        placeholder="10-digit number" 
                        className="w-full px-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all" 
                      />
                      {errors.phone_number && <p className="text-xs text-rose-500 font-bold mt-1">{errors.phone_number.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Personal Email *</label>
                      <input 
                        {...register("personal_email")} 
                        type="email" 
                        placeholder="personal@email.com" 
                        className="w-full px-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all" 
                      />
                      {errors.personal_email && <p className="text-xs text-rose-500 font-bold mt-1">{errors.personal_email.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Home Address</label>
                    <textarea 
                      {...register("address")} 
                      placeholder="Full address" 
                      rows={2}
                      className="w-full px-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all resize-none" 
                    />
                  </div>

                  <div className="space-y-2 pb-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Emergency Contact Line</label>
                    <input 
                      {...register("emergency_contact")} 
                      placeholder="Name - Relationship - Phone" 
                      className="w-full px-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all" 
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: PROFESSIONAL INFO */}
              {step === 2 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="flex items-center gap-3 pb-1 text-indigo-600 dark:text-indigo-400">
                    <Building2 className="w-5 h-5" />
                    <div>
                      <h4 className="text-sm font-bold tracking-tight text-slate-800 dark:text-white">Professional Profile</h4>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5 font-semibold">
                        Relational Corporate Context
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Department *</label>
                      <div className="relative">
                        <Controller
                          control={control}
                          name="department"
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={(val) => {
                                field.onChange(val);
                                // Reset designation when department changes
                                setValue("designation", "");
                              }}
                              placeholder="Select Department"
                              buttonClassName="w-full px-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                            >
                              {DEPARTMENTS.map((dept: any) => (
                                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                              ))}
                            </Select>
                          )}
                        />
                      </div>
                      {errors.department && <p className="text-xs text-rose-500 font-bold mt-1">{errors.department.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Designation / Role *</label>
                      <div className="relative">
                        <Controller
                          control={control}
                          name="designation"
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="— Select Role —"
                              buttonClassName={cn("w-full px-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all", !watch("department") && "opacity-50 cursor-not-allowed pointer-events-none")}
                            >
                              {getDesignationsForDepartment(watch("department") || "").map((orgRole: any) => (
                                <SelectItem key={orgRole.id} value={orgRole.id}>{orgRole.name}</SelectItem>
                              ))}
                            </Select>
                          )}
                        />
                      </div>
                      {errors.designation && <p className="text-xs text-rose-500 font-bold mt-1">{errors.designation.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Employment Type *</label>
                      <div className="relative">
                        <Controller
                          control={control}
                          name="employment_type"
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="— Select Type —"
                              buttonClassName="w-full px-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                            >
                              <SelectItem value="full-time">Full Time</SelectItem>
                              <SelectItem value="part-time">Part Time</SelectItem>
                              <SelectItem value="contract">Contract</SelectItem>
                              <SelectItem value="intern">Intern</SelectItem>
                            </Select>
                          )}
                        />
                      </div>
                      {errors.employment_type && <p className="text-xs text-rose-500 font-bold mt-1">{errors.employment_type.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Monthly Salary (Base, ₹)</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="number" 
                          {...register("salary")} 
                          placeholder="0"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all" 
                        />
                      </div>
                      {errors.salary && <p className="text-xs text-rose-500 font-bold mt-1">{errors.salary.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Experience (Years)</label>
                      <input 
                        type="number" 
                        step="0.5" 
                        {...register("experience")} 
                        placeholder="0"
                        className="w-full px-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all" 
                      />
                      {errors.experience && <p className="text-xs text-rose-500 font-bold mt-1">{errors.experience.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Joining Date *</label>
                      <Controller
                        control={control}
                        name="joining_date"
                        render={({ field }) => (
                      <PremiumDatePicker
                        value={field.value}
                        side="right"
                        onChange={(date) => {
                          field.onChange(date);
                        }}
                      />
                        )}
                      />
                      {errors.joining_date && <p className="text-xs text-rose-500 font-bold mt-1">{errors.joining_date.message}</p>}
                    </div>
                  </div>





                </div>
              )}

              {/* STEP 3: DOCUMENT REPOSITORY */}
              {step === 3 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="flex items-center gap-3 pb-1 text-indigo-600 dark:text-indigo-400">
                    <FileText className="w-5 h-5" />
                    <div>
                      <h4 className="text-sm font-bold tracking-tight text-slate-800 dark:text-white">Document Repository</h4>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5 font-semibold">
                        Securely upload identity proofs or contracts.
                      </p>
                    </div>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div 
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 bg-slate-500/[0.01] hover:bg-slate-500/[0.03] transition-all cursor-pointer relative"
                    onClick={() => document.getElementById('wizard-file-input')?.click()}
                  >
                    <input 
                      id="wizard-file-input"
                      type="file" 
                      multiple
                      className="hidden" 
                      onChange={handleFileUpload}
                    />
                    <div className="p-4 bg-slate-200 dark:bg-white/5 rounded-full text-slate-600 dark:text-white/80 border border-slate-300/50 dark:border-white/10">
                      <span className="text-xl font-bold">+</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Click or drag to upload</p>
                    <p className="text-sm text-slate-400 font-semibold">PDF, JPG, PNG up to 4MB</p>
                  </div>

                  {/* Empty staged list */}
                  {uploadedFiles.length === 0 && (
                    <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs font-semibold">
                      No documents in repository.
                    </div>
                  )}

                  {/* Upload List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-3 pt-1">
                      <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400">Staged Documents ({uploadedFiles.length})</h5>
                      <div className="space-y-2">
                        {uploadedFiles.map((file) => (
                          <div
                            key={file.id}
                            className="p-4 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-between gap-4 shadow-sm"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <input
                                  type="text"
                                  value={file.label || ""}
                                  onChange={(e) => handleDocumentNameChange(file.id, e.target.value)}
                                  placeholder={file.name}
                                  className="w-full text-xs font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-white/10 focus:border-indigo-400 outline-none transition-all pb-0.5"
                                />
                                <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {uploadProgress[file.id] < 100 ? (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                  <span className="text-xs font-mono text-indigo-600">{uploadProgress[file.id]}%</span>
                                </div>
                              ) : (
                                <>
                                  {file.url && (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewDoc(file)}
                                      className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-500 rounded-xl transition-all"
                                      title="Preview document"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeFile(file.id)}
                                    className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 rounded-xl transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: LOGIN & ACCESS */}
              {step === 4 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="flex items-center gap-3 pb-1 text-indigo-600 dark:text-indigo-400">
                    <Lock className="w-5 h-5" />
                    <div>
                      <h4 className="text-sm font-bold tracking-tight text-slate-800 dark:text-white">System Credentials</h4>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5 font-semibold">
                        Configure work identity and password.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Unique Employee ID (Auto-Generated) *</label>
                      <input 
                        {...register("employee_id")} 
                        readOnly
                        placeholder="MH-EMP-XXXXX" 
                        className="w-full px-4 py-3 bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed opacity-75 outline-none transition-all dark:text-slate-400" 
                      />
                      {errors.employee_id && <p className="text-xs text-rose-500 font-bold mt-1">{errors.employee_id.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Work Email Address *</label>
                      <input 
                        {...register("email")} 
                        type="email" 
                        placeholder="employee@agency.com" 
                        className="w-full px-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all" 
                      />
                      {showStep4Errors && errors.email && <p className="text-xs text-rose-500 font-bold mt-1">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2 text-left">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Password *</label>
                      <div className="relative">
                        <input 
                          {...register("password")} 
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••" 
                          className="w-full pl-4 pr-11 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {showStep4Errors && errors.password && <p className="text-xs text-rose-500 font-bold mt-1">{errors.password.message}</p>}
                    </div>

                    <div className="space-y-2 text-left">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Confirm Password *</label>
                      <div className="relative">
                        <input 
                          {...register("confirm_password")} 
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••" 
                          className="w-full pl-4 pr-11 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {showStep4Errors && errors.confirm_password && <p className="text-xs text-rose-500 font-bold mt-1">{errors.confirm_password.message}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-8 py-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/40 dark:bg-[#0a0d16] flex items-center justify-between">
              <Button 
                type="button" 
                onClick={handleClose} 
                variant="outline"
                className="h-10 text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                Cancel
              </Button>
              
              <div className="flex items-center gap-3">
                {step > 1 && (
                  <Button 
                    type="button" 
                    onClick={prevStep} 
                    variant="outline"
                    className="h-10 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200"
                  >
                    Back
                  </Button>
                )}
                
                {step < 4 ? (
                  <Button 
                    type="button" 
                    onClick={nextStep}
                    variant="hr"
                    className="h-10 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button 
                    disabled={isSubmitting} 
                    type="button" 
                    onClick={() => {
                      setShowStep4Errors(true);
                      handleSubmit(onSubmit, onError)();
                    }}
                    variant="hr"
                    className="h-10 text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isSubmitting ? "Provisioning..." : "Provision Account"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Doc Preview Overlay */}
      {previewDoc && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white dark:bg-[#0a0d16] rounded-2xl shadow-2xl overflow-hidden w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5">
              <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{previewDoc.label || previewDoc.name}</p>
              <button onClick={() => setPreviewDoc(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-all">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              {previewDoc.url?.startsWith('data:image') ? (
                <img src={previewDoc.url} alt={previewDoc.label || previewDoc.name} className="w-full h-auto object-contain" />
              ) : previewDoc.url?.startsWith('data:application/pdf') ? (
                <iframe src={previewDoc.url} className="w-full h-[70vh]" title={previewDoc.label || previewDoc.name} />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <FileText className="w-12 h-12 mb-3" />
                  <p className="text-sm font-semibold">Preview not available for this file type.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
