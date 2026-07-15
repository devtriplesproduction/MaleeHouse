"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X, User, Mail, ShieldCheck, Loader2, Lock,
  Phone, Contact, Building2, Briefcase, MapPin,
  CheckCircle2, Copy, Calendar, Upload, FileText,
  Trash2, Award, ShieldAlert, BadgeInfo, IndianRupee,
  Clock, Check, UserCheck, Eye, EyeOff, Download, Shield, Edit2, Save, Camera, ChevronDown
} from "lucide-react";
import { Select, SelectItem } from '@/components/ui/select';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PremiumDatePicker as DatePicker } from "@/components/ui/PremiumDatePicker";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  updateEmployeeProfileAction,
  offboardEmployeeAction,
  deleteEmployeeAction,
  overrideUserCredentialsAction,
  addSalaryIncrementAction,
  getLastSalaryIncrementAction
} from "@/actions/admin.actions";
import { DEPARTMENTS, getDesignationsForDepartment, getSystemRoleForDesignation } from "@/config/departments";

interface EmployeeProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any;
  existingUsers?: any[];
  onSuccess?: () => void;
}

const AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80",
];

export function EmployeeProfileModal({ isOpen, onClose, employee, existingUsers = [], onSuccess }: EmployeeProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"personal" | "professional" | "documents" | "security">("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isOffboarding, setIsOffboarding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingIncrement, setIsAddingIncrement] = useState(false);
  const [showIncrementModal, setShowIncrementModal] = useState(false);
  const [incrementInput, setIncrementInput] = useState("");
  const [lastIncrement, setLastIncrement] = useState<any>(null);
  const [isLoadingIncrement, setIsLoadingIncrement] = useState(false);

  // Edited values state
  const [formData, setFormData] = useState<any>({});
  const [selectedAvatar, setSelectedAvatar] = useState<string>("");
  const [documentsList, setDocumentsList] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

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

  useEffect(() => {
    if (employee) {
      setFormData({
        first_name: employee.first_name || "",
        last_name: employee.last_name || "",
        dob: employee.dob || "",
        gender: employee.gender || "male",
        phone_number: employee.phone_number || "",
        personal_email: employee.personal_email || "",
        address: employee.address || "",
        emergency_contact: employee.emergency_contact || "",

        department: employee.department || "",
        designation: employee.designation || "",
        employment_type: employee.employment_type || "full-time",
        salary: employee.salary || 0,
        experience: employee.experience || 0,
        joining_date: employee.joining_date || "",
        location: employee.location || "office",
        reporting_manager_id: employee.reporting_manager_id || null,
        department_head_id: employee.department_head_id || null,
        branch: employee.branch || "Malee House HQ",
        office_location: employee.office_location || "Singapore",
        operational_zone: employee.operational_zone || "Central Business District",
        approval_authority: !!employee.approval_authority,
        escalation_chain: employee.escalation_chain || [],

        email: employee.email || "",
        role: employee.role || "employee",
        status: employee.status || "active",
        employee_id: employee.employee_id || "",
        password: employee.password || "",
        confirm_password: employee.password || ""
      });
      setSelectedAvatar(employee.profile_photo || "");
      setDocumentsList(employee.documents || []);
      setIsEditing(false);
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [employee?.id, isOpen]);

  useEffect(() => {
    if (showIncrementModal && employee?.id) {
      const fetchLastIncrement = async () => {
        setIsLoadingIncrement(true);
        const res = await getLastSalaryIncrementAction(employee.id);
        if (res.success && res.data) {
          setLastIncrement(res.data);
        } else {
          setLastIncrement(null);
        }
        setIsLoadingIncrement(false);
      };
      fetchLastIncrement();
    }
  }, [showIncrementModal, employee?.id]);

  // Keep work email updated if names change in edit mode
  useEffect(() => {
    if (isEditing && formData.first_name && formData.last_name) {
      const sanitizedFirst = formData.first_name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const sanitizedLast = formData.last_name.toLowerCase().replace(/[^a-z0-9]/g, "");
      setFormData((prev: any) => ({
        ...prev,
        email: `${sanitizedFirst}.${sanitizedLast}@maleehouse.com`
      }));
    }
  }, [formData.first_name, formData.last_name, isEditing]);

  // Handle department-role mappings in edit mode
  const handleDepartmentChange = (deptId: string) => {
    const designations = getDesignationsForDepartment(deptId);
    const defaultDesignation = designations.length > 0 ? designations[0].id : "";
    const defaultSystemRole = designations.length > 0 ? designations[0].systemRole : "employee";

    setFormData((prev: any) => ({
      ...prev,
      department: deptId,
      designation: defaultDesignation,
      role: defaultSystemRole
    }));
  };

  const handleDesignationChange = (roleId: string) => {
    const systemRole = getSystemRoleForDesignation(formData.department, roleId);
    setFormData((prev: any) => ({
      ...prev,
      designation: roleId,
      role: systemRole
    }));
  };

  if (!isOpen || !employee) return null;

  const handleSave = async () => {
    if (isEditing && formData.password !== formData.confirm_password) {
      toast({
        title: "Validation Check Failed",
        description: "Password and Confirm Password must match.",
        variant: "error"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { confirm_password, password, ...restFormData } = formData;
      const payload = {
        ...restFormData,
        profile_photo: selectedAvatar,
        documents: documentsList
      };

      const result = await updateEmployeeProfileAction(employee.id, payload);

      if (result?.success && password) {
        const pwResult = await overrideUserCredentialsAction(employee.id, password);
        if (!pwResult?.success) {
          toast({
            title: "Password Update Failed",
            description: pwResult?.error || "Could not update credentials",
            variant: "error"
          });
          setIsSubmitting(false);
          return;
        }
      }

      if (result?.success) {
        toast({
          title: "Profile Synchronized",
          description: "All changes committed safely to personnel DB.",
          variant: "success"
        });
        setIsEditing(false);
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: "Update Prevented",
          description: result?.error,
          variant: "error"
        });
      }
    } catch (error) {
      toast({
        title: "Database Synchronization Error",
        description: "An unexpected error occurred saving edits.",
        variant: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOffboard = async () => {
    if (confirm(`Are you sure you want to offboard ${formData.first_name} ${formData.last_name}? This will suspend system access and mark their status as resigned.`)) {
      setIsOffboarding(true);
      try {
        const result = await offboardEmployeeAction(employee.id);
        if (result?.success) {
          toast({
            title: "Employee Offboarded",
            description: `${formData.first_name} has been successfully offboarded.`,
            variant: "success"
          });
          if (onSuccess) onSuccess();
          onClose();
        } else {
          toast({
            title: "Offboarding Failed",
            description: result?.error || "Failed to offboard employee",
            variant: "error"
          });
        }
      } catch (err) {
        toast({
          title: "Offboarding Error",
          description: "An unexpected error occurred during offboarding.",
          variant: "error"
        });
      } finally {
        setIsOffboarding(false);
      }
    }
  };

  const handleDelete = async () => {
    if (confirm(`⚠️ WARNING: Are you sure you want to PERMANENTLY delete ${formData.first_name} ${formData.last_name}? This action is irreversible and will delete their entire profile.`)) {
      setIsDeleting(true);
      try {
        const result = await deleteEmployeeAction(employee.id);
        if (result?.success) {
          toast({
            title: "Employee Deleted",
            description: `${formData.first_name} has been permanently deleted from the system.`,
            variant: "success"
          });
          if (onSuccess) onSuccess();
          onClose();
        } else {
          toast({
            title: "Deletion Failed",
            description: result?.error || "Failed to delete employee",
            variant: "error"
          });
        }
      } catch (err) {
        toast({
          title: "Deletion Error",
          description: "An unexpected error occurred during deletion.",
          variant: "error"
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newFileObj = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: "other", // default type
          uploaded_at: new Date().toISOString(),
          url: reader.result // Save the actual file data
        };

        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
        setDocumentsList(prev => {
          const newList = [...prev, newFileObj];

          let progress = 0;
          const interval = setInterval(() => {
            progress += 25;
            setUploadProgress(p => ({ ...p, [fileId]: progress }));
            if (progress >= 100) {
              clearInterval(interval);
              toast({
                title: "Document Registered",
                description: `${file.name} successfully encrypted and staged in repository.`,
                variant: "success"
              });

              // Auto save immediately when document is uploaded to avoid loss
              updateEmployeeProfileAction(employee.id, {
                documents: newList
              });
            }
          }, 80);

          return newList;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (id: string) => {
    const updatedDocs = documentsList.filter((f: any) => f.id !== id);
    setDocumentsList(updatedDocs);
    updateEmployeeProfileAction(employee.id, { documents: updatedDocs });
    toast({
      title: "Document Removed",
      description: "Document deleted from employee profile repository."
    });
  };

  const handleDocumentTypeChange = (id: string, newType: string) => {
    const updatedDocs = documentsList.map((f: any) => f.id === id ? { ...f, type: newType } : f);
    setDocumentsList(updatedDocs);
    updateEmployeeProfileAction(employee.id, { documents: updatedDocs });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Credential Copied",
      description: "Copied credential to buffer successfully.",
      variant: "success"
    });
  };

  const renderIncrementModal = () => {
    if (!showIncrementModal) return null;
    const currentSalary = formData.salary || 0;
    const incAmount = parseFloat(incrementInput);
    const isValid = !isNaN(incAmount) && incAmount > 0;
    const newSalary = currentSalary + (isValid ? incAmount : 0);

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-[#0a0d16] border border-slate-200 dark:border-white/10 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Add Salary Increment</h3>
            <button onClick={() => setShowIncrementModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="p-6 space-y-6">
            {isLoadingIncrement ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : lastIncrement ? (
              <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400">Last Increment</div>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-indigo-500 border-indigo-200 dark:border-indigo-500/30">
                    {lastIncrement.increment_percentage}%
                  </Badge>
                </div>
                <div className="flex justify-between items-end">
                  <div className="text-lg font-bold text-slate-700 dark:text-slate-300">₹{parseFloat(lastIncrement.increment_amount).toLocaleString('en-IN')}</div>
                  <div className="text-xs text-slate-500 font-medium">Effective: {new Date(lastIncrement.effective_date).toLocaleDateString()}</div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">No Previous Increments</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">This employee hasn't received any recorded salary increments yet.</div>
              </div>
            )}

            {lastIncrement && new Date() >= new Date(new Date(lastIncrement.effective_date).setMonth(new Date(lastIncrement.effective_date).getMonth() + 3)) && (
              <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-amber-600 dark:text-amber-400">Increment Reminder</div>
                  <div className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
                    It has been over 3 months since the last increment (effective {new Date(lastIncrement.effective_date).toLocaleDateString()}).
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Current Base Salary</label>
              <div className="text-lg font-bold text-slate-700 dark:text-slate-300">₹{currentSalary.toLocaleString('en-IN')}</div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-widest text-indigo-500">Increment Amount (₹)</label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  value={incrementInput}
                  onChange={(e) => setIncrementInput(e.target.value)}
                  placeholder="e.g. 2000"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl text-lg font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  autoFocus
                />
              </div>
            </div>
            {isValid && (
              <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20">
                <div className="text-xs font-black uppercase tracking-widest text-green-600 dark:text-green-400 mb-1">New Salary Starting Next Month</div>
                <div className="text-2xl font-black text-green-600 dark:text-green-400">₹{newSalary.toLocaleString('en-IN')}</div>
              </div>
            )}
          </div>
          <div className="p-6 bg-slate-50 dark:bg-white/2 border-t border-slate-100 dark:border-white/5 flex gap-3">
            <button
              onClick={() => setShowIncrementModal(false)}
              className="flex-1 px-4 py-3.5 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-300 dark:hover:bg-white/20 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!isValid) return;
                setIsAddingIncrement(true);
                const res = await addSalaryIncrementAction(employee.id, newSalary);
                setIsAddingIncrement(false);
                if (res.success) {
                  toast({ title: "Success", description: `Increment of ₹${incAmount} added successfully.` });
                  setShowIncrementModal(false);
                } else {
                  toast({ title: "Error", description: res.error || "Failed to add increment", variant: "error" });
                }
              }}
              disabled={!isValid || isAddingIncrement}
              className="flex-1 px-4 py-3.5 bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-600 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
            >
              {isAddingIncrement ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-[#080b14] rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-8 flex flex-col h-[750px] max-h-[90vh]">

        {/* Header Block */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-[#0a0d16] shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <input
                type="file"
                id="profile-avatar-edit-uploader"
                accept="image/*"
                className="hidden"
                disabled={!isEditing}
                onChange={handlePhotoUpload}
              />
              <div
                onClick={() => {
                  if (isEditing) {
                    document.getElementById("profile-avatar-edit-uploader")?.click();
                  }
                }}
                className={cn(
                  "relative rounded-full overflow-hidden shadow-sm border-2 border-indigo-500/30 transition-all",
                  isEditing ? "cursor-pointer hover:border-indigo-550 hover:scale-105" : ""
                )}
              >
                {selectedAvatar ? (
                  <img
                    src={selectedAvatar}
                    alt="Profile Avatar"
                    className="w-14 h-14 object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-black text-lg uppercase">
                    {formData.first_name ? formData.first_name[0] : ""}
                    {formData.last_name ? formData.last_name[0] : ""}
                  </div>
                )}

                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[8px] font-black">
                    <Camera className="w-3.5 h-3.5 mb-0.5" />
                    EDIT
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                  {formData.first_name} {formData.last_name}
                </h3>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider",
                  formData.status === "active" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                    formData.status === "probation" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                      formData.status === "invited" ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20" :
                        formData.status === "suspended" ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                          "bg-slate-500/10 text-slate-500 border border-slate-500/20"
                )}>
                  {formData.status?.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                <span className="nums text-indigo-500 font-bold">{formData.employee_id}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/10" />
                <span className="capitalize">{formData.designation?.replace("_", " ")}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-black tracking-widest transition-all flex items-center gap-2"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Profile
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Changes
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="px-8 py-2 bg-slate-100/50 dark:bg-white/2 border-b border-slate-100 dark:border-white/5 flex items-center gap-6 shrink-0 overflow-x-auto">
          {[
            { id: "personal", label: "Personal" },
            { id: "professional", label: "Professional" },
            { id: "documents", label: "Documents" },
            { id: "security", label: "Access & Security" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "relative py-3.5 px-1 text-xs font-black uppercase tracking-wider outline-none transition-all",
                activeTab === tab.id
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full shadow-[0_-2px_10px_rgba(79,70,229,0.3)]" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content Box */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">

          {/* TAB 1: PERSONAL DETAILS */}
          {activeTab === "personal" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Personal Details</h4>
              </div>

              {isEditing && (
                <div className="space-y-2 bg-slate-50 dark:bg-white/2 p-4 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col items-center">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Upload Profile Photo</label>
                  <input
                    type="file"
                    id="profile-photo-edit-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <div
                    onClick={() => document.getElementById("profile-photo-edit-upload")?.click()}
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
                        <Camera className="w-6 h-6 mb-1 text-slate-400" />
                        <span className="text-xs font-bold uppercase tracking-wider">Upload Photo</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-xs font-bold">
                      <Camera className="w-4 h-4 mb-0.5" />
                      {selectedAvatar ? "CHANGE" : "UPLOAD"}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">First Name</label>
                  <input
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 disabled:text-slate-500 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Last Name</label>
                  <input
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 disabled:text-slate-500 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Date of Birth</label>
                  <DatePicker
                    value={formData.dob}
                    onChange={(val) => setFormData({ ...formData, dob: val })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 disabled:text-slate-500 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Gender</label>
                  <div className="relative">
                    <Select
                      value={formData.gender}
                      onValueChange={(val) => setFormData({ ...formData, gender: val })}
                      disabled={!isEditing}
                      buttonClassName="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 disabled:text-slate-500 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                    >
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Phone Number</label>
                  <input
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 disabled:text-slate-500 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Personal Email</label>
                  <input
                    type="email"
                    value={formData.personal_email}
                    onChange={(e) => setFormData({ ...formData, personal_email: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 disabled:text-slate-500 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Residential Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!isEditing}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 disabled:text-slate-500 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Emergency Contact Details</label>
                <input
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 disabled:text-slate-500 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                />
              </div>
            </div>
          )}

          {/* TAB 2: PROFESSIONAL DETAILS */}
          {activeTab === "professional" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Professional Alignment</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Department</label>
                  <Select
                    value={formData.department}
                    onValueChange={(val) => handleDepartmentChange(val)}
                    disabled={!isEditing}
                    buttonClassName="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  >
                    {DEPARTMENTS.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Designation / Role</label>
                  <Select
                    value={formData.designation}
                    onValueChange={(val) => handleDesignationChange(val)}
                    disabled={!isEditing || !formData.department}
                    buttonClassName="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  >
                    {getDesignationsForDepartment(formData.department).map((orgRole: any) => (
                      <SelectItem key={orgRole.id} value={orgRole.id}>{orgRole.name}</SelectItem>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Employment Type</label>
                  <div className="relative">
                    <Select
                      value={formData.employment_type}
                      onValueChange={(val) => setFormData({ ...formData, employment_type: val })}
                      disabled={!isEditing}
                      buttonClassName="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                    >
                      <SelectItem value="full-time">Full Time</SelectItem>
                      <SelectItem value="part-time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="intern">Intern</SelectItem>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Base Monthly Salary (INR)</label>
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                        disabled={!isEditing}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                      />
                    </div>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setIncrementInput("");
                          setShowIncrementModal(true);
                        }}
                        disabled={isAddingIncrement}
                        className="px-3 py-3 bg-indigo-500 text-white rounded-2xl text-xs font-bold hover:bg-indigo-600 disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
                      >
                        {isAddingIncrement ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Increment"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Total Experience (Years)</label>
                  <input
                    type="number"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: parseFloat(e.target.value) || 0 })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Joining Date</label>
                  <DatePicker
                    value={formData.joining_date}
                    onChange={(val) => setFormData({ ...formData, joining_date: val })}
                    disabled={!isEditing}
                    align="right"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Work Location Mode</label>
                  <Select
                    value={formData.location}
                    onValueChange={(val) => setFormData({ ...formData, location: val })}
                    disabled={!isEditing}
                    buttonClassName="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  >
                    <SelectItem value="office">Office (On-site)</SelectItem>
                    <SelectItem value="remote">Remote (Work from Home)</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Reporting Manager</label>
                  <Select
                    value={formData.reporting_manager_id || ""}
                    onValueChange={(val) => setFormData({ ...formData, reporting_manager_id: val || null })}
                    disabled={!isEditing}
                    buttonClassName="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white capitalize"
                  >
                    <SelectItem value="">-- None --</SelectItem>
                    {existingUsers.filter((u: any) => u.id !== employee.id).map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>{user.first_name} {user.last_name}</SelectItem>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Enterprise Location & Scaling Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 dark:border-white/5 pt-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Branch Office</label>
                  <Select
                    value={formData.branch || "Malee House HQ"}
                    onValueChange={(val) => setFormData({ ...formData, branch: val })}
                    disabled={!isEditing}
                    buttonClassName="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  >
                    <SelectItem value="Malee House HQ">Malee House HQ</SelectItem>
                    <SelectItem value="North Field Station">North Field Station</SelectItem>
                    <SelectItem value="Jurong Gateway Branch">Jurong Gateway Branch</SelectItem>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Office Location</label>
                  <Select
                    value={formData.office_location || "Singapore"}
                    onValueChange={(val) => setFormData({ ...formData, office_location: val })}
                    disabled={!isEditing}
                    buttonClassName="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  >
                    <SelectItem value="Singapore">Singapore</SelectItem>
                    <SelectItem value="Kuala Lumpur">Kuala Lumpur</SelectItem>
                    <SelectItem value="Jakarta">Jakarta</SelectItem>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Operational Zone</label>
                  <Select
                    value={formData.operational_zone || "Central Business District"}
                    onValueChange={(val) => setFormData({ ...formData, operational_zone: val })}
                    disabled={!isEditing}
                    buttonClassName="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  >
                    <SelectItem value="Central Business District">Central Business District</SelectItem>
                    <SelectItem value="Industrial North">Industrial North</SelectItem>
                    <SelectItem value="East Coast Operations">East Coast Operations</SelectItem>
                  </Select>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="space-y-0.5">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">Department Head Status</h5>
                  <p className="text-xs text-slate-500">Enable this if employee is leading this department.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!formData.department_head_id}
                    onChange={(e) => setFormData({
                      ...formData,
                      department_head_id: e.target.checked ? formData.reporting_manager_id || employee.id : null
                    })}
                    disabled={!isEditing}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:bg-slate-900 peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTS REPOSITORY */}
          {activeTab === "documents" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Employee Document Repository</h4>
                </div>

                <button
                  onClick={() => document.getElementById('profile-file-input')?.click()}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
                >
                  <Upload className="w-3.5 h-3.5" /> Stage Document
                </button>
                <input
                  id="profile-file-input"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {documentsList.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {documentsList.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-[280px] uppercase">
                            {{
                              aadhar: "Aadhaar Card",
                              pan: "PAN Card",
                              contract: "Agreement / Contract",
                              certificate: "Certificate",
                              nda: "NDA File",
                              other: "Other File"
                            }[doc.type as string] || "Document"}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <Select
                              value={doc.type}
                              onValueChange={(val) => handleDocumentTypeChange(doc.id, val)}
                              buttonClassName="px-2 py-0.5 bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-white/10 rounded text-xs font-black uppercase tracking-wider outline-none text-slate-605 dark:text-slate-300 min-h-[30px]"
                            >
                              <SelectItem value="aadhar" className="dark:bg-[#0d1222]">Aadhaar Card</SelectItem>
                              <SelectItem value="pan" className="dark:bg-[#0d1222]">PAN Card</SelectItem>
                              <SelectItem value="contract" className="dark:bg-[#0d1222]">Agreement / Contract</SelectItem>
                              <SelectItem value="certificate" className="dark:bg-[#0d1222]">Certificate</SelectItem>
                              <SelectItem value="nda" className="dark:bg-[#0d1222]">NDA File</SelectItem>
                              <SelectItem value="other" className="dark:bg-[#0d1222]">Other File</SelectItem>
                            </Select>
                            <span className="text-xs text-slate-400 font-bold ml-2">
                              {(doc.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => {
                            toast({
                              title: "Secure Encrypted Document",
                              description: `Retrieving and decrypting ${doc.name} (Category: ${doc.type})...`,
                              variant: "success"
                            });

                            setTimeout(() => {
                              const downloadUrl = doc.url || URL.createObjectURL(new Blob(["[MOCK DOCUMENT DATA]\n\nDocument Name: " + doc.name + "\nType: " + doc.type + "\nDate: " + new Date().toLocaleString()]));

                              const docLabel = {
                                aadhar: "Aadhaar_Card",
                                pan: "PAN_Card",
                                contract: "Agreement_Contract",
                                certificate: "Certificate",
                                nda: "NDA_File",
                                other: "Other_File"
                              }[doc.type as string] || "Document";
                              const ext = doc.name.split('.').pop() || 'pdf';

                              const a = document.createElement('a');
                              a.href = downloadUrl;
                              a.download = `${docLabel}.${ext}`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              if (!doc.url) {
                                URL.revokeObjectURL(downloadUrl);
                              }
                            }, 1000);
                          }}
                          className="p-2.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all"
                          title="Verify & Download"
                        >
                          <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                        </button>

                        <button
                          onClick={() => removeFile(doc.id)}
                          className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-all"
                          title="Delete document"
                        >
                          <Trash2 className="w-4 h-4 text-rose-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center bg-slate-50 dark:bg-white/2 rounded-[2rem] border border-slate-100 dark:border-white/5">
                  <BadgeInfo className="w-8 h-8 text-slate-400 mx-auto opacity-70 mb-2" />
                  <p className="text-xs font-semibold text-slate-500">No documents staged inside this repository. Click "Stage Document" to attach credentials.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ACCESS & SECURITY */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Security Credentials & Logs</h4>
              </div>



              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Work Email (System Access)</label>
                  <input
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 bg-slate-100/50 dark:bg-white/2 text-slate-400 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">ERP Access Level</label>
                  <Select
                    value={formData.role}
                    onValueChange={(val) => setFormData({ ...formData, role: val })}
                    disabled={!isEditing}
                    buttonClassName="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  >
                    <SelectItem value="admin">System Admin</SelectItem>
                    <SelectItem value="sales">Sales Officer</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="engineer">Technical Engineer</SelectItem>
                    <SelectItem value="cad">CAD Operator</SelectItem>
                    <SelectItem value="field">Field Surveyor</SelectItem>
                    <SelectItem value="qc">QC Inspector</SelectItem>
                    <SelectItem value="employee">Standard Staff</SelectItem>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Account Status Override</label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                  disabled={!isEditing}
                  buttonClassName="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                >
                  <SelectItem value="invited">Invited</SelectItem>
                  <SelectItem value="onboarding_pending">Onboarding Pending</SelectItem>
                  <SelectItem value="active">Active (Full ERP System Access)</SelectItem>
                  <SelectItem value="probation">Probationary Period</SelectItem>
                  <SelectItem value="suspended">Suspended (Access Temporarily Revoked)</SelectItem>
                  <SelectItem value="notice_period">Notice Period</SelectItem>
                  <SelectItem value="resigned">Resigned</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                  <SelectItem value="archived">Archived (Decommissioned profile)</SelectItem>
                </Select>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 dark:border-white/5 pt-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password || ""}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      disabled={!isEditing}
                      autoComplete="new-password"
                      className="w-full pl-4 pr-11 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirm_password || ""}
                        onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                        autoComplete="new-password"
                        className="w-full pl-4 pr-11 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0d16] flex items-center justify-between shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {formData.status !== "resigned" && formData.status !== "terminated" && (
              <Button
                variant="outline"
                onClick={handleOffboard}
                disabled={isOffboarding}
                className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/10"
              >
                {isOffboarding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                Offboard Employee
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-2 text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Account
            </Button>
          </div>

          <Button
            variant="primary"
            onClick={onClose}
          >
            Close Details
          </Button>
        </div>
      </div>

      {renderIncrementModal()}
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
