"use client";

import React, { useState } from "react";
import { Edit2, Save, X, Loader2, Camera, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateMyProfileAction } from "@/actions/auth.actions";
import { PremiumDatePicker as DatePicker } from "@/components/ui/PremiumDatePicker";
import { cn } from "@/lib/utils";

export default function EditPersonalProfileClient({ profile }: { profile: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    dob: profile.dob || "",
    gender: profile.gender || "male",
    phone_number: profile.phone_number || "",
    personal_email: profile.personal_email || "",
    address: profile.address || "",
    emergency_contact: profile.emergency_contact || "",
    blood_group: profile.blood_group || "O+",
  });
  const [selectedAvatar, setSelectedAvatar] = useState(profile.profile_photo || "");
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

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        profile_photo: selectedAvatar,
      };

      const result = await updateMyProfileAction(payload);

      if (result?.success) {
        toast({
          title: "Profile Updated",
          description: "Your personal information has been updated successfully.",
          variant: "success"
        });
        setIsEditing(false);
      } else {
        toast({
          title: "Update Failed",
          description: result?.error || "Failed to update profile.",
          variant: "error"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // if (!isEditing) {
  //   return (
  //     <div className="flex justify-end mt-4">
  //       <button
  //         onClick={() => setIsEditing(true)}
  //         className="px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
  //       >
  //         <Edit2 className="w-3.5 h-3.5" /> Edit Personal Info
  //       </button>
  //     </div>
  //   );
  // }

  return (
    <div className="mt-8 bg-white dark:bg-[#0a0d16] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 space-y-6 animate-in slide-in-from-bottom-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <Edit2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Edit Personal Information</h3>
            <p className="text-xs font-bold text-slate-500">Update your contact and personal details.</p>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(false)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col items-center p-4 bg-slate-50 dark:bg-white/2 rounded-2xl border border-slate-200 dark:border-white/5">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Profile Photo</label>
          <input
            type="file"
            id="personal-photo-upload"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <div
            onClick={() => document.getElementById("personal-photo-upload")?.click()}
            className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/15 flex flex-col items-center justify-center bg-slate-500/[0.03] hover:border-indigo-600 cursor-pointer overflow-hidden group"
          >
            {selectedAvatar ? (
              <img src={selectedAvatar} alt="Avatar" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400">
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold uppercase">Upload</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-xs font-bold">
              <Camera className="w-4 h-4 mb-0.5" /> CHANGE
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Date of Birth</label>
            <DatePicker
              value={formData.dob}
              onChange={(val) => setFormData({ ...formData, dob: val })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Blood Group</label>
            <input
              value={formData.blood_group}
              onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Phone Number</label>
            <input
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Personal Email</label>
            <input
              type="email"
              value={formData.personal_email}
              onChange={(e) => setFormData({ ...formData, personal_email: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Emergency Contact (Name - Relation - Mobile)</label>
          <input
            value={formData.emergency_contact}
            onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
            placeholder="e.g. John Doe - Brother - 9876543210"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Residential Address</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows={2}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
          <button
            onClick={() => setIsEditing(false)}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-indigo-400 hover:bg-indigo-400 text-white rounded-xl text-xs font-black tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
