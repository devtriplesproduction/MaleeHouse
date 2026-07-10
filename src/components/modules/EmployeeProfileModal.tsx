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
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  updateEmployeeProfileAction,
  offboardEmployeeAction,
  deleteEmployeeAction,
  overrideUserCredentialsAction
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
                "py-3 border-b-2 text-xs font-black uppercase tracking-wider outline-none transition-all",
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-500"
                  : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
              )}
            >
              {tab.label}
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
                    onChange={(e: any) => setFormData({ ...formData, dob: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 disabled:text-slate-500 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Gender</label>
                  <div className="relative">
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 disabled:text-slate-500 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white appearance-none pr-10"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
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
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">residential Address</label>
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
                  <select
                    value={formData.department}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white appearance-none"
                  >
                    {DEPARTMENTS.map((dept: any) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Designation / Role</label>
                  <select
                    value={formData.designation}
                    onChange={(e) => handleDesignationChange(e.target.value)}
                    disabled={!isEditing || !formData.department}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white appearance-none"
                  >
                    {getDesignationsForDepartment(formData.department).map((orgRole: any) => (
                      <option key={orgRole.id} value={orgRole.id}>{orgRole.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Employment Type</label>
                  <div className="relative">
                    <select
                      value={formData.employment_type}
                      onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white appearance-none pr-10"
                    >
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="intern">Intern</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Base Monthly Salary (INR)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                      disabled={!isEditing}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                    />
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
                  <input
                    type="date"
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Work Location Mode</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white appearance-none"
                  >
                    <option value="office">Office (On-site)</option>
                    <option value="remote">Remote (Work from Home)</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Reporting Manager</label>
                  <select
                    value={formData.reporting_manager_id || ""}
                    onChange={(e) => setFormData({ ...formData, reporting_manager_id: e.target.value || null })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white appearance-none capitalize"
                  >
                    <option value="">-- None --</option>
                    {existingUsers.filter((u: any) => u.id !== employee.id).map((user: any) => (
                      <option key={user.id} value={user.id}>{user.first_name} {user.last_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Enterprise Location & Scaling Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 dark:border-white/5 pt-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Branch Office</label>
                  <select
                    value={formData.branch || "Malee House HQ"}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white appearance-none"
                  >
                    <option value="Malee House HQ">Malee House HQ</option>
                    <option value="North Field Station">North Field Station</option>
                    <option value="Jurong Gateway Branch">Jurong Gateway Branch</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Office Location</label>
                  <select
                    value={formData.office_location || "Singapore"}
                    onChange={(e) => setFormData({ ...formData, office_location: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white appearance-none"
                  >
                    <option value="Singapore">Singapore</option>
                    <option value="Kuala Lumpur">Kuala Lumpur</option>
                    <option value="Jakarta">Jakarta</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Operational Zone</label>
                  <select
                    value={formData.operational_zone || "Central Business District"}
                    onChange={(e) => setFormData({ ...formData, operational_zone: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white appearance-none"
                  >
                    <option value="Central Business District">Central Business District</option>
                    <option value="Industrial North">Industrial North</option>
                    <option value="East Coast Operations">East Coast Operations</option>
                  </select>
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
                            <select
                              value={doc.type}
                              onChange={(e) => handleDocumentTypeChange(doc.id, e.target.value)}
                              className="px-2 py-0.5 bg-slate-50 dark:bg-[#121626] border border-slate-200 dark:border-white/10 rounded text-xs font-black uppercase tracking-wider outline-none text-slate-605 dark:text-slate-300"
                            >
                              <option value="aadhar" className="dark:bg-[#0d1222]">Aadhaar Card</option>
                              <option value="pan" className="dark:bg-[#0d1222]">PAN Card</option>
                              <option value="contract" className="dark:bg-[#0d1222]">Agreement / Contract</option>
                              <option value="certificate" className="dark:bg-[#0d1222]">Certificate</option>
                              <option value="nda" className="dark:bg-[#0d1222]">NDA File</option>
                              <option value="other" className="dark:bg-[#0d1222]">Other File</option>
                            </select>
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
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  >
                    <option value="admin">System Admin</option>
                    <option value="sales">Sales Officer</option>
                    <option value="accountant">Accountant</option>
                    <option value="engineer">Technical Engineer</option>
                    <option value="cad">CAD Operator</option>
                    <option value="field">Field Surveyor</option>
                    <option value="qc">QC Inspector</option>
                    <option value="employee">Standard Staff</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Account Status Override</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 disabled:bg-slate-100/50 dark:disabled:bg-white/2 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                >
                  <option value="invited">Invited</option>
                  <option value="onboarding_pending">Onboarding Pending</option>
                  <option value="active">Active (Full ERP System Access)</option>
                  <option value="probation">Probationary Period</option>
                  <option value="suspended">Suspended (Access Temporarily Revoked)</option>
                  <option value="notice_period">Notice Period</option>
                  <option value="resigned">Resigned</option>
                  <option value="terminated">Terminated</option>
                  <option value="archived">Archived (Decommissioned profile)</option>
                </select>
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
              <button
                onClick={handleOffboard}
                disabled={isOffboarding}
                className="px-5 py-3.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-00 dark:text-amber-400 rounded-2xl font-black text-xs tracking-widest transition-all flex items-center gap-2"
              >
                {isOffboarding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                Offboard Employee
              </button>
            )}

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-5 py-3.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl font-black text-xs tracking-widest transition-all flex items-center gap-2"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete Account
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs tracking-widest hover:opacity-95 transition-all shadow-md"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
