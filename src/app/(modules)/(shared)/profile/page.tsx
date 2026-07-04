import React from "react";
import { requireAuth } from "@/lib/auth-guard";
import { Shield, Mail, Phone, Calendar, Briefcase, User as UserIcon, MapPin, Globe, Users, FileText, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import UpdatePasswordClient from "./UpdatePasswordClient";
import ActiveSessionsClient from "./ActiveSessionsClient";
import EditPersonalProfileClient from "./EditPersonalProfileClient";
import { getCompanySettingsAction } from "@/actions/settings.actions";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
   const { profile: rawProfile } = await requireAuth();
   const profile = rawProfile as any;
   const companySettings = await getCompanySettingsAction();

   const formatDate = (dateString?: string) => {
      if (!dateString) return "N/A";
      const d = new Date(dateString);
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
   };

   const calculateValidity = (joinDateStr?: string) => {
      if (!joinDateStr) return "N/A";
      const d = new Date(joinDateStr);
      d.setFullYear(d.getFullYear() + 1);
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
   };

   return (
      <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pt-0 px-4 md:px-8 pb-8">
         {/* ── Header Section ── */}
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60 dark:border-white/5">
            <div className="space-y-1">
               <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                  User <span className="text-indigo-500">Profile</span>
               </h1>
               <p className="text-lg text-gray-500 dark:text-gray-400 font-normal">
                  Manage your personal identity and security parameters within the ecosystem.
               </p>
            </div>
         </div>

         {/* ── Identity Cards Section ── */}
         <div className="flex flex-col lg:flex-row gap-5 items-center justify-center">

            {/* Front Card */}
            <div className="w-[350px] h-[580px] bg-[#f8f9fa] rounded-2xl shadow-2xl overflow-hidden relative flex flex-col border-2 border-gray-100">
               {/* Top Header */}
               <div className="bg-[#102b4e] pt-6 pb-6 px-4 flex flex-col items-center relative z-10" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 80%, 90% 100%, 0 100%)' }}>
                  <div className="flex items-center gap-3">
                     {/* Logo Placeholder */}
                     <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                        <Home className="text-[#f16821] w-8 h-8" strokeWidth={2.5} />
                     </div>
                     <div className="flex flex-col mt-1">
                        <h2 className="text-white font-bold text-2xl leading-none">MALEE HOUSE</h2>
                        <p className="text-[#f16821] text-[9px] font-bold tracking-widest mt-1">SURVEY & MAPPING SERVICES</p>
                     </div>
                  </div>
               </div>

               {/* Identity Card Badge */}
               <div className="flex justify-center -mt-4 z-20 relative">
                  <div className="bg-[#102b4e] text-white text-xs font-bold px-4 py-1 rounded-full border-2 border-white shadow-sm">
                     IDENTITY CARD
                  </div>
               </div>

               {/* Body */}
               <div className="flex-1 px-4 py-5 flex flex-col relative">
                  {/* Background Watermark/Pattern */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '15px 15px' }}></div>

                  <div className="flex gap-4 relative z-10 mt-2">
                     {/* Photo */}
                     <div className="w-28 h-[140px] bg-white rounded-lg border-2 border-[#102b4e] overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
                        {profile.profile_photo ? (
                           <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                           <UserIcon className="w-12 h-12 text-gray-400" />
                        )}
                     </div>

                     {/* Details */}
                     <div className="flex flex-col gap-1.5 text-[11px] mt-1">
                        <div className="grid grid-cols-[80px_10px_1fr] gap-0.5">
                           <span className="font-bold text-[#102b4e]">Name</span>
                           <span className="font-bold text-[#102b4e]">:</span>
                           <span className="text-gray-800 font-semibold">{profile.first_name} {profile.last_name}</span>
                        </div>
                        <div className="grid grid-cols-[80px_10px_1fr] gap-0.5">
                           <span className="font-bold text-[#102b4e]">Employee ID</span>
                           <span className="font-bold text-[#102b4e]">:</span>
                           <span className="text-gray-800 font-semibold">{profile.employee_id || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-[80px_10px_1fr] gap-0.5">
                           <span className="font-bold text-[#102b4e]">Designation</span>
                           <span className="font-bold text-[#102b4e]">:</span>
                           <span className="text-gray-800 font-semibold capitalize">{profile.designation?.replace('_', ' ') || profile.role || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-[80px_10px_1fr] gap-0.5">
                           <span className="font-bold text-[#102b4e]">Department</span>
                           <span className="font-bold text-[#102b4e]">:</span>
                           <span className="text-gray-800 font-semibold capitalize">{profile.department || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-[80px_10px_1fr] gap-0.5">
                           <span className="font-bold text-[#102b4e]">Date of Birth</span>
                           <span className="font-bold text-[#102b4e]">:</span>
                           <span className="text-gray-800 font-semibold">{formatDate(profile.dob)}</span>
                        </div>
                        <div className="grid grid-cols-[80px_10px_1fr] gap-0.5">
                           <span className="font-bold text-[#102b4e]">Blood Group</span>
                           <span className="font-bold text-[#102b4e]">:</span>
                           <span className="text-gray-800 font-semibold">{profile.blood_group || 'O+'}</span>
                        </div>
                        <div className="grid grid-cols-[80px_10px_1fr] gap-0.5">
                           <span className="font-bold text-[#102b4e]">Date of Joining</span>
                           <span className="font-bold text-[#102b4e]">:</span>
                           <span className="text-gray-800 font-semibold">{formatDate(profile.joining_date)}</span>
                        </div>
                        <div className="grid grid-cols-[80px_10px_1fr] gap-0.5">
                           <span className="font-bold text-[#102b4e]">Validity</span>
                           <span className="font-bold text-[#102b4e]">:</span>
                           <span className="text-gray-800 font-semibold">{calculateValidity(profile.joining_date)}</span>
                        </div>
                     </div>
                  </div>

                  {/* Signatures & Stamp */}
                  <div className="mt-auto flex justify-between items-end relative z-10">
                     {/* Stamp */}
                     <div className="w-16 h-16 rounded-full border-[2.5px] border-[#102b4e] flex items-center justify-center text-[#102b4e] text-[7px] text-center font-extrabold rotate-[-20deg] opacity-80 leading-tight">
                        MALEE HOUSE <br /> SATARA <br /> SURVEY & <br /> MAPPING
                     </div>

                     {/* Signature */}
                     <div className="flex flex-col items-center">
                        <div className="h-8 border-b border-gray-400 w-24 mb-1 flex items-end justify-center">
                           {/* Simulated Signature */}
                           <span className="font-serif text-xl text-gray-800 italic pr-2">Aulai</span>
                        </div>
                        <span className="text-[10px] text-[#102b4e] font-bold">Authorized Signatory</span>
                     </div>
                  </div>
               </div>

               {/* Footer */}
               <div className="bg-[#102b4e] text-white p-3 flex items-center gap-3 relative border-t-[5px] border-[#f16821]">
                  <div className="w-12 h-12 bg-white p-1 rounded-sm flex-shrink-0">
                     <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=www.maleehouse.com" className="w-full h-full" alt="QR" />
                  </div>
                  <div className="flex flex-col justify-center">
                     <p className="text-[10px] leading-tight text-gray-300">Empowering Precision,</p>
                     <p className="text-[10px] leading-tight mb-0.5 text-gray-300">Delivering Excellence</p>
                     <p className="text-[11px] font-bold text-white tracking-wide mt-1">www.maleehouse.com</p>
                  </div>
               </div>
            </div>

            {/* Back Card */}
            <div className="w-[350px] h-[580px] bg-[#f8f9fa] rounded-2xl shadow-2xl overflow-hidden relative flex flex-col border-2 border-gray-100">
               {/* Top Header */}
               <div className="bg-[#102b4e] pt-5 pb-5 px-4 flex flex-col items-center relative z-10" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 85% 85%, 0 85%)' }}>
                  <h2 className="text-white font-bold text-3xl leading-none mb-2 mt-2">MALEE HOUSE</h2>
                  <div className="flex items-center gap-3">
                     <div className="h-[1px] w-8 bg-white/40"></div>
                     <p className="text-white text-[9px] font-bold tracking-widest">SURVEY & MAPPING SERVICES</p>
                     <div className="h-[1px] w-8 bg-white/40"></div>
                  </div>
               </div>

               {/* Body */}
               <div className="flex-1 px-5 py-4 flex flex-col gap-1.5 text-xs relative text-gray-800">
                  {/* Contact Details */}
                  <div className="flex gap-3 items-start">
                     <div className="text-[#f16821] mt-0.5"><MapPin className="w-4 h-4" /></div>
                     <div>
                        <p className="font-bold text-[#102b4e] mb-0.5">Office Address</p>
                        <p className="text-[10px] text-gray-600 font-medium">{companySettings.name}, {companySettings.address},<br />{companySettings.cityStateZip}</p>
                     </div>
                  </div>
                  <div className="flex gap-3 items-start">
                     <div className="text-[#f16821] mt-0.5"><Phone className="w-4 h-4" /></div>
                     <div>
                        <p className="font-bold text-[#102b4e] mb-0.5">Contact</p>
                        <p className="text-[10px] text-gray-600 font-medium">{companySettings.telephone} | {companySettings.mobile}</p>
                     </div>
                  </div>
                  <div className="flex gap-3 items-start">
                     <div className="text-[#f16821] mt-0.5"><Mail className="w-4 h-4" /></div>
                     <div>
                        <p className="font-bold text-[#102b4e] mb-0.5">Email</p>
                        <p className="text-[10px] text-gray-600 font-medium">info@maleehouse.com</p>
                     </div>
                  </div>
                  <div className="flex gap-3 items-start">
                     <div className="text-[#f16821] mt-0.5"><Globe className="w-4 h-4" /></div>
                     <div>
                        <p className="font-bold text-[#102b4e] mb-0.5">Website</p>
                        <p className="text-[10px] text-gray-600 font-medium">www.maleehouse.com</p>
                     </div>
                  </div>

                  <hr className="border-gray-300 my-0.5" />

                  {/* Emergency Contact */}
                  <div className="bg-[#102b4e] text-white flex items-center gap-2 px-3 py-1 rounded-full w-max mb-0.5">
                     <Users className="w-3.5 h-3.5" />
                     <span className="text-[10px] font-bold tracking-wide">EMERGENCY CONTACT</span>
                  </div>
                  <div className="grid grid-cols-[60px_10px_1fr] gap-0 text-[10px] ml-9">
                     <span className="font-bold text-[#102b4e]">Name</span>
                     <span className="font-bold text-[#102b4e]">:</span>
                     <span className="text-gray-700 font-medium">{profile.emergency_contact?.split('-')?.[0]?.trim() || "Kiran Kirdat"}</span>
                  </div>
                  <div className="grid grid-cols-[60px_10px_1fr] gap-0 text-[10px] ml-9">
                     <span className="font-bold text-[#102b4e]">Relation</span>
                     <span className="font-bold text-[#102b4e]">:</span>
                     <span className="text-gray-700 font-medium">{profile.emergency_contact?.split('-')?.[1]?.trim() || "Family"}</span>
                  </div>
                  <div className="grid grid-cols-[60px_10px_1fr] gap-0 text-[10px] ml-9">
                     <span className="font-bold text-[#102b4e]">Mobile No.</span>
                     <span className="font-bold text-[#102b4e]">:</span>
                     <span className="text-gray-700 font-medium">{profile.emergency_contact?.split('-')?.[2]?.trim() || profile.emergency_contact || "+91 98221 12345"}</span>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="bg-[#102b4e] text-white flex items-center gap-2 px-3 py-1 rounded-full w-max mb-0.5 mt-1.5">
                     <FileText className="w-3.5 h-3.5" />
                     <span className="text-[10px] font-bold tracking-wide">TERMS & CONDITIONS</span>
                  </div>
                  <ol className="list-decimal pl-5 pr-2 text-[9.5px] text-gray-700 font-medium space-y-0.5 mt-0.5 leading-snug">
                     <li>This card is the property of Malee House Survey & Mapping Services.</li>
                     <li>This card must be carried during office hours and field visits.</li>
                     <li>Loss of card should be reported immediately.</li>
                     <li>Misuse of this card may result in disciplinary action.</li>
                     <li>This card must be returned upon completion of internship/employment.</li>
                  </ol>
               </div>

               {/* Footer */}
               <div className="bg-[#102b4e] h-6 w-full mt-auto"></div>
            </div>
         </div>

         {/* ── Edit Personal Information Section ── */}
         <div className="max-w-3xl mx-auto pt-4">
            <EditPersonalProfileClient profile={profile} />
         </div>

         {/* ── Security Protocol Section ── */}
         <div className="max-w-3xl mx-auto pt-8">
            <div className="glass-card p-8 border-white/10 bg-indigo-500/[0.02] space-y-8">
               <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                     <Shield className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Security Protocol</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">Safeguard your operational access. We recommend rotating your credentials periodically.</p>
               </div>

               <div className="space-y-4">
                  <UpdatePasswordClient userId={profile.id} />
                  <ActiveSessionsClient />
               </div>
            </div>
         </div>

      </div>
   );
}
