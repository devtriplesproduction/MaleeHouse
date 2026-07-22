"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X, User, Mail, ShieldCheck, Loader2, Lock,
  Phone, Contact, Building2, Briefcase, MapPin,
  CheckCircle2, Copy, Calendar, Upload, FileText,
  Trash2, Award, ShieldAlert, BadgeInfo, IndianRupee,
  Clock, Check, UserCheck, Eye, EyeOff, Download, Shield, Edit2, Save, Camera, AlertCircle, ChevronDown, TrendingUp
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
  addSalaryIncrementAction,
  getLastSalaryIncrementAction,
  getSalaryIncrementHistoryAction,
  resetEmployeePasswordAction
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
  const [activeTab, setActiveTab] = useState<"personal" | "professional" | "documents" | "salary" | "security">("personal");
  const [isEditing, setIsEditing] = useState(true);
  const [initialFormData, setInitialFormData] = useState<any>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const [isOffboarding, setIsOffboarding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAddingIncrement, setIsAddingIncrement] = useState(false);
  const [showInlineHikeForm, setShowInlineHikeForm] = useState(false);
  const [incrementInput, setIncrementInput] = useState("");
  const [incrementEffectiveDate, setIncrementEffectiveDate] = useState("");
  const [pendingHike, setPendingHike] = useState<{ newSalary: number; previousSalary: number; effectiveDate: string } | null>(null);
  const [lastIncrement, setLastIncrement] = useState<any>(null);
  const [incrementHistory, setIncrementHistory] = useState<any[]>([]);
  const [isLoadingIncrement, setIsLoadingIncrement] = useState(false);

  // Edited values state
  const [formData, setFormData] = useState<any>({});
  const [selectedAvatar, setSelectedAvatar] = useState<string>("");
  const [documentsList, setDocumentsList] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [previewDoc, setPreviewDoc] = useState<any>(null);

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
      const initialData = {
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


        office_location: employee.office_location || "Singapore",
        operational_zone: employee.operational_zone || "Central Business District",
        approval_authority: !!employee.approval_authority,
        escalation_chain: employee.escalation_chain || [],

        email: employee.email || "",
        role: employee.role || "employee",
        status: employee.status || "active",
        employee_id: employee.employee_id || ""

      };
      setFormData(initialData);
      setInitialFormData(initialData);
      setSelectedAvatar(employee.profile_photo || "");
      setDocumentsList(employee.documents || []);

    }
  }, [employee?.id, isOpen]);

  useEffect(() => {
    if (activeTab === "salary" && employee?.id) {
      const fetchIncrementData = async () => {
        setIsLoadingIncrement(true);
        const [lastRes, histRes] = await Promise.all([
          getLastSalaryIncrementAction(employee.id),
          getSalaryIncrementHistoryAction(employee.id)
        ]);

        if (lastRes.success) {
          setLastIncrement(lastRes.data);
        } else {
          setLastIncrement(null);
        }

        if (histRes.success) {
          setIncrementHistory(histRes.data || []);
        } else {
          setIncrementHistory([]);
        }
        setIsLoadingIncrement(false);
      };
      fetchIncrementData();
    }
  }, [activeTab, employee?.id]);

  // Keep work email updated if names change in edit mode
  useEffect(() => {
    if (isEditing && formData.first_name && formData.last_name && initialFormData) {
      if (formData.first_name !== initialFormData.first_name || formData.last_name !== initialFormData.last_name) {
        const sanitizedFirst = formData.first_name.toLowerCase().replace(/[^a-z0-9]/g, "");
        const sanitizedLast = formData.last_name.toLowerCase().replace(/[^a-z0-9]/g, "");
        setFormData((prev: any) => ({
          ...prev,
          email: `${sanitizedFirst}.${sanitizedLast}@maleehouse.com`
        }));
      }
    }
  }, [formData.first_name, formData.last_name, isEditing, initialFormData]);

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

  const handleClose = () => {
    let hasChanges = false;
    if (initialFormData) {
      const normalize = (obj: any) => JSON.stringify(
        Object.keys(obj).sort().reduce((acc: any, key: string) => {
          acc[key] = obj[key];
          return acc;
        }, {})
      );
      if (normalize(formData) !== normalize(initialFormData)) {
        hasChanges = true;
      }
    }

    // Check for other unsaved modifications
    if (selectedAvatar !== (employee?.profile_photo || "")) hasChanges = true;
    if (pendingHike !== null) hasChanges = true;
    if (showInlineHikeForm && incrementInput.trim() !== "") hasChanges = true;
    if (JSON.stringify(documentsList) !== JSON.stringify(employee?.documents || [])) hasChanges = true;

    if (hasChanges) {
      setShowCloseConfirm(true);
      return;
    }

    onClose();
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // If there's a staged hike, commit it to DB first
      if (pendingHike) {
        const hikeRes = await addSalaryIncrementAction(
          employee.id,
          pendingHike.newSalary,
          pendingHike.effectiveDate || undefined
        );
        if (!hikeRes.success) {
          toast({ title: "Hike Failed", description: hikeRes.error || "Failed to apply salary increment", variant: "error" });
          setIsSubmitting(false);
          return;
        }
        setPendingHike(null);
      }

      const { ...restFormData } = formData;
      const payload = {
        ...restFormData,
        profile_photo: selectedAvatar,
        documents: documentsList
      };

      const result = await updateEmployeeProfileAction(employee.id, payload);

      if (result?.success) {
        toast({
          title: "Profile Synchronized",
          description: "All changes committed safely to personnel DB.",
          variant: "success"
        });
        setInitialFormData({ ...formData });
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

  const handleDocumentNameChange = (id: string, newName: string) => {
    const updatedDocs = documentsList.map((f: any) => f.id === id ? { ...f, label: newName } : f);
    setDocumentsList(updatedDocs);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Credential Copied",
      description: "Copied credential to buffer successfully.",
      variant: "success"
    });
  };



  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={handleClose} />

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
                  <div className="w-14 h-14 bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-semibold text-lg uppercase">
                    {formData.first_name ? formData.first_name[0] : ""}
                    {formData.last_name ? formData.last_name[0] : ""}
                  </div>
                )}

                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[8px] font-semibold">
                    <Camera className="w-3.5 h-3.5 mb-0.5" />
                    EDIT
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white leading-tight">
                  {formData.first_name} {formData.last_name}
                </h3>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-sm font-semibold",
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
            <button
              type="button"
              onClick={handleClose}
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
            { id: "salary", label: "Salary & Hike" },
            { id: "security", label: "Access & Security" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "relative py-3.5 px-1 text-sm font-semibold outline-none transition-all",
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





              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">First Name *</label>
                  <input
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Last Name *</label>
                  <input
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Date of Birth *</label>
                  <DatePicker
                    value={formData.dob}
                    onChange={(val) => setFormData({ ...formData, dob: val })}
                    disabled={!isEditing}
                    side="right"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Gender *</label>
                  <div className="relative">
                    <Select
                      value={formData.gender}
                      onValueChange={(val) => setFormData({ ...formData, gender: val })}
                      disabled={!isEditing}
                      buttonClassName="w-full px-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                    >
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Phone Number *</label>
                  <input
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Personal Email *</label>
                  <input
                    type="email"
                    value={formData.personal_email}
                    onChange={(e) => setFormData({ ...formData, personal_email: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Residential Address *</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!isEditing}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Emergency Contact Details *</label>
                <input
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* TAB 2: PROFESSIONAL DETAILS */}
          {activeTab === "professional" && (
            <div className="space-y-6 animate-in fade-in duration-300">


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Department *</label>
                  <Select
                    value={formData.department}
                    onValueChange={(val) => handleDepartmentChange(val)}
                    disabled={!isEditing}
                    buttonClassName="w-full px-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                  >
                    {DEPARTMENTS.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Designation / Role *</label>
                  <Select
                    value={formData.designation}
                    onValueChange={(val) => handleDesignationChange(val)}
                    disabled={!isEditing || !formData.department}
                    buttonClassName="w-full px-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                  >
                    {getDesignationsForDepartment(formData.department).map((orgRole: any) => (
                      <SelectItem key={orgRole.id} value={orgRole.id}>{orgRole.name}</SelectItem>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Employment Type *</label>
                  <div className="relative">
                    <Select
                      value={formData.employment_type}
                      onValueChange={(val) => setFormData({ ...formData, employment_type: val })}
                      disabled={!isEditing}
                      buttonClassName="w-full px-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                    >
                      <SelectItem value="full-time">Full Time</SelectItem>
                      <SelectItem value="part-time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="intern">Intern</SelectItem>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Base Salary (₹) *</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      value={formData.salary || 0}
                      onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Experience (Years) *</label>
                  <input
                    type="number"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: parseFloat(e.target.value) || 0 })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Joining Date *</label>
                  <DatePicker
                    value={formData.joining_date}
                    onChange={(val) => setFormData({ ...formData, joining_date: val })}
                    disabled={!isEditing}
                    side="right"
                  />
                </div>
              </div>



            </div>
          )}

          {/* TAB 3: DOCUMENTS REPOSITORY */}
          {activeTab === "documents" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {documentsList.length > 0 && (
                <div className="flex items-center justify-between">
                  <Button
                    onClick={() => document.getElementById('profile-file-input')?.click()}
                    variant="hr"
                    size="sm"
                    className="gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Document
                  </Button>
                </div>
              )}
              <input id="profile-file-input" type="file" multiple className="hidden" onChange={handleFileUpload} />

              {documentsList.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {documentsList.map((doc) => (
                    <div key={doc.id} className="p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <input
                            type="text"
                            value={doc.label || doc.name || ""}
                            onChange={(e) => handleDocumentNameChange(doc.id, e.target.value)}
                            placeholder="Document name..."
                            className="w-full text-xs font-bold text-slate-800 dark:text-slate-200 bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-white/10 focus:border-indigo-400 outline-none transition-all pb-0.5"
                          />
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">{(doc.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {(() => {
                          const u = doc.url || doc.file_url || doc.file_path || doc.path || doc.link || doc.publicUrl || doc.src || doc.source || doc.file;
                          if (u) {
                            return (
                              <>
                                <button
                                  onClick={() => setPreviewDoc(doc)}
                                  className="p-2.5 bg-slate-50 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                                  title="Preview document"
                                >
                                  <Eye className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                                </button>
                                <a
                                  href={u}
                                  download={doc.label || doc.name || "document"}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="p-2.5 bg-slate-50 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all flex items-center justify-center"
                                  title="Download document"
                                >
                                  <Download className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                                </a>
                              </>
                            );
                          }
                          return (
                            <>
                              <button
                                disabled
                                className="p-2.5 bg-slate-50 dark:bg-white/5 opacity-50 cursor-not-allowed rounded-xl transition-all"
                                title="File data is missing from database"
                              >
                                <Eye className="w-4 h-4 text-slate-400" />
                              </button>
                              <button
                                disabled
                                className="p-2.5 bg-slate-50 dark:bg-white/5 opacity-50 cursor-not-allowed rounded-xl transition-all flex items-center justify-center"
                                title="File data is missing from database"
                              >
                                <Download className="w-4 h-4 text-slate-400" />
                              </button>
                            </>
                          );
                        })()}
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
                <div className="p-10 text-center bg-slate-50 dark:bg-white/2 rounded-[2rem] border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-500">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No documents uploaded</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">Upload certificates, resumes, contracts, or other reference files.</p>
                  </div>
                  <Button
                    onClick={() => document.getElementById('profile-file-input')?.click()}
                    variant="hr"
                    size="sm"
                    className="gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload First Document
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Doc Preview Overlay */}
          {previewDoc && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setPreviewDoc(null)}>
              <div className="bg-white dark:bg-[#0a0d16] rounded-2xl shadow-2xl overflow-hidden w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{previewDoc.label || previewDoc.name}</p>
                  <button onClick={() => setPreviewDoc(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-all">
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  {(() => {
                    const u = previewDoc.url || previewDoc.file_url || previewDoc.file_path || previewDoc.path || previewDoc.link || previewDoc.publicUrl || previewDoc.src || previewDoc.source || previewDoc.file || '';
                    const isImg = u.startsWith('data:image') || u.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                    const isPdf = u.startsWith('data:application/pdf') || u.match(/\.pdf$/i);

                    if (isImg) {
                      return (
                        <div className="w-full h-[70vh] bg-slate-50/50 dark:bg-black/20 flex items-center justify-center p-4">
                          <img src={u} alt={previewDoc.label || previewDoc.name} className="max-w-full max-h-full object-contain rounded-lg" />
                        </div>
                      );
                    } else if (isPdf) {
                      return <iframe src={u} className="w-full h-[70vh] border-0" title={previewDoc.label || previewDoc.name} />;
                    } else {
                      return (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                          <FileText className="w-12 h-12 mb-3" />
                          <p className="text-sm font-semibold mb-4">Preview not available for this file type.</p>
                          <a href={u} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium text-sm hover:bg-indigo-100 transition-colors">
                            Download File
                          </a>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SALARY & HIKE */}
          {activeTab === "salary" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Pending hike notice */}
              {pendingHike && (
                <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex-1">
                    Hike of ₹{pendingHike.newSalary.toLocaleString('en-IN')} is staged but <strong>not saved yet</strong>. Click <strong>Save Changes</strong> below to commit.
                  </p>
                  <button
                    onClick={() => { setPendingHike(null); setFormData((prev: any) => ({ ...prev, salary: pendingHike.previousSalary })); }}
                    className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline shrink-0"
                  >
                    Undo
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Salary & Hike Management</h4>
                  <p className="text-xs text-slate-500 mt-1">Current compensation and timeline of salary increments</p>
                </div>
                {isEditing && (
                  <Button
                    onClick={() => {
                      if (!showInlineHikeForm) {
                        setIncrementInput("");
                        setIncrementEffectiveDate("");
                      }
                      setShowInlineHikeForm(!showInlineHikeForm);
                    }}
                    className={cn(
                      "h-[46px] px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md",
                      showInlineHikeForm
                        ? "bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 shadow-none"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
                    )}
                  >
                    {showInlineHikeForm ? <X className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    {showInlineHikeForm ? "Cancel Hike" : "Give Hike"}
                  </Button>
                )}
              </div>

              {showInlineHikeForm ? (
                <div className="p-6 bg-slate-50 dark:bg-white/[0.02] border border-indigo-100 dark:border-indigo-500/20 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-300">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-6">Apply Salary Increment</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Previous Salary (₹)</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={(formData.salary || 0).toLocaleString('en-IN')}
                          disabled
                          className="w-full pl-10 pr-4 py-3 bg-slate-100/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">New Total Salary (₹) *</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="number"
                          value={incrementInput}
                          onChange={(e) => setIncrementInput(e.target.value)}
                          placeholder="e.g. 50000"
                          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#0a0d16] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all shadow-sm"
                          autoFocus
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Effective From</label>
                      <DatePicker
                        value={incrementEffectiveDate}
                        onChange={(val) => setIncrementEffectiveDate(val)}
                        side="right"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Leave blank to default to the 1st of next month</p>
                    </div>

                    {(() => {
                      const newSalaryInput = parseFloat(incrementInput);
                      const currentSalary = formData.salary || 0;
                      const isValid = !isNaN(newSalaryInput) && newSalaryInput > currentSalary;

                      return (
                        <Button
                          onClick={() => {
                            if (!isValid) return;
                            // Stage the hike locally — only committed when Save Changes is clicked
                            setPendingHike({
                              newSalary: newSalaryInput,
                              previousSalary: currentSalary,
                              effectiveDate: incrementEffectiveDate
                            });
                            setFormData((prev: any) => ({ ...prev, salary: newSalaryInput }));
                            setShowInlineHikeForm(false);
                            setIncrementInput("");
                            setIncrementEffectiveDate("");
                            toast({ title: "Hike Staged", description: `Salary updated to ₹${newSalaryInput.toLocaleString('en-IN')}. Click Save Changes to commit.`, variant: "success" });
                          }}
                          disabled={!isValid || isAddingIncrement}
                          className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 mb-[18px]"
                        >
                          <TrendingUp className="w-4 h-4" />
                          Confirm Hike
                        </Button>
                      );
                    })()}
                  </div>
                </div>
              ) : (

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Current Salary */}
                  <div className="bg-slate-50 dark:bg-[#0d1222] border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col justify-center items-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center mb-3 text-indigo-600 dark:text-indigo-400 relative z-10">
                      <IndianRupee className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 relative z-10">Current Salary</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white relative z-10">₹{(formData.salary || 0).toLocaleString('en-IN')}</h3>
                  </div>

                  {/* Next Hike */}
                  {(() => {
                    const baseDate = lastIncrement
                      ? new Date(lastIncrement.effective_date)
                      : employee?.joining_date
                        ? new Date(employee.joining_date)
                        : null;
                    const nextHikeDate = baseDate
                      ? new Date(new Date(baseDate).setFullYear(new Date(baseDate).getFullYear() + 1))
                      : null;
                    const isOverdue = nextHikeDate && new Date() > nextHikeDate;
                    const daysLeft = nextHikeDate
                      ? Math.ceil((nextHikeDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : null;

                    return (
                      <div className={`rounded-2xl p-5 flex flex-col justify-center items-center border relative overflow-hidden group ${isOverdue ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'}`}>
                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-110 ${isOverdue ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`} />
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 relative z-10 ${isOverdue ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 relative z-10 ${isOverdue ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {isOverdue ? 'Hike Overdue' : 'Next Hike'}
                        </p>
                        {nextHikeDate ? (
                          <>
                            <h3 className={`text-lg font-bold relative z-10 ${isOverdue ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-800 dark:text-emerald-200'}`}>
                              {nextHikeDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </h3>
                            <p className={`text-[11px] font-semibold mt-1 relative z-10 ${isOverdue ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600/80 dark:text-emerald-400/80'}`}>
                              {isOverdue ? `${Math.abs(daysLeft!)} days overdue` : `in ${daysLeft} days`}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 relative z-10">Not set</p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Last Hike */}
                  <div className="bg-slate-50 dark:bg-[#0d1222] border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col justify-center items-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 dark:bg-violet-500/5 rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center mb-3 text-violet-600 dark:text-violet-400 relative z-10">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 relative z-10">Last Hike</p>
                    {lastIncrement ? (
                      <>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white relative z-10">+₹{parseFloat(lastIncrement.increment_amount).toLocaleString('en-IN')}</h3>
                        <p className="text-[11px] font-semibold text-slate-400 mt-1 relative z-10">
                          {new Date(lastIncrement.effective_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 relative z-10">No history yet</p>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Salary Increment History</h4>

                {isLoadingIncrement ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  </div>
                ) : incrementHistory.length > 0 ? (
                  <div className="space-y-3">
                    {incrementHistory.map((hist: any) => (
                      <div key={hist.id} className="p-5 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                            <TrendingUp className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-slate-900 dark:text-white">₹{parseFloat(hist.new_salary).toLocaleString('en-IN')}</span>
                              <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10">
                                +{parseFloat(hist.increment_percentage).toFixed(1)}%
                              </Badge>
                            </div>
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                              Increased from ₹{parseFloat(hist.previous_salary).toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            + ₹{parseFloat(hist.increment_amount).toLocaleString('en-IN')}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-1">
                            {new Date(hist.effective_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-slate-50 dark:bg-white/2 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <Clock className="w-8 h-8" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">No Salary History</h4>
                    <p className="text-xs font-medium text-slate-500">This employee hasn't received any recorded increments yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: ACCESS & SECURITY */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-6 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">System Permissions</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Manage ERP roles and account status.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Work Email (System Access) *</label>
                    <input
                      value={formData.email}
                      disabled
                      className="w-full h-11 px-4 py-2 bg-slate-100/50 dark:bg-white/2 text-slate-400 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Account Status Override *</label>
                    <Select
                      value={formData.status}
                      onValueChange={(val) => setFormData({ ...formData, status: val })}
                      disabled={!isEditing}
                      buttonClassName="w-full h-11 px-4 bg-white dark:bg-[#0a0d16] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
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
                </div>
              </div>

              {/* Change Password Section */}
              <div className="p-6 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">Reset Password</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Set a new login password for this employee.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        autoComplete="new-password"
                        className="w-full h-11 px-4 pr-11 bg-white dark:bg-[#0a0d16] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        autoComplete="new-password"
                        className="w-full h-11 px-4 pr-11 bg-white dark:bg-[#0a0d16] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-rose-500 font-semibold mt-2">Passwords do not match.</p>
                )}

                <Button
                  variant="hr"
                  size="sm"
                  className="mt-5 gap-2 bg-rose-600 hover:bg-rose-700"
                  disabled={isResettingPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                  onClick={async () => {
                    setIsResettingPassword(true);
                    const result = await resetEmployeePasswordAction(employee.id, newPassword);
                    setIsResettingPassword(false);
                    if (result?.success) {
                      toast({ title: "Password Updated", description: "The employee's password has been reset successfully.", variant: "success" });
                      setNewPassword("");
                      setConfirmPassword("");
                    } else {
                      toast({ title: "Reset Failed", description: result?.error || "Could not reset password.", variant: "error" });
                    }
                  }}
                >
                  {isResettingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Reset Password
                </Button>
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
              Terminate Employee
            </Button>
          </div>

          <Button variant="hr" onClick={handleSave} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
          </Button>
        </div>
      </div>



      {/* Confirm Close Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCloseConfirm(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#080b14] rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Unsaved Changes</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              You have unsaved changes to this profile. Are you sure you want to close without saving?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowCloseConfirm(false)}>
                Cancel
              </Button>
              <Button variant="primary" className="flex-1 bg-amber-500 hover:bg-amber-600 border-none text-white" onClick={() => {
                // Reset form back to original, clear any staged hike
                if (initialFormData) setFormData({ ...initialFormData });
                setPendingHike(null);
                setShowInlineHikeForm(false);
                setShowCloseConfirm(false);
                onClose();
              }}>
                Discard Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
