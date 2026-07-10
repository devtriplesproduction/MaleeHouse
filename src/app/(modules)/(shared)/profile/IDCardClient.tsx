"use client";

import React, { useRef, useState } from "react";
import { Download, MapPin, Phone, Mail, Globe, Users, FileText, Home, User as UserIcon, Edit2, Check, X } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";

export default function IDCardClient({ profile: initialProfile, companySettings }: { profile: any, companySettings: any }) {
   const [profile, setProfile] = useState(initialProfile);
   const [isEditing, setIsEditing] = useState(false);
   const frontCardRef = useRef<HTMLDivElement>(null);
   const backCardRef = useRef<HTMLDivElement>(null);
   const [isDownloading, setIsDownloading] = useState(false);

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

   // Editable values state
   const [editData, setEditData] = useState({
      firstName: profile.first_name || "",
      lastName: profile.last_name || "",
      employeeId: profile.employee_id || "N/A",
      designation: profile.designation?.replace('_', ' ') || profile.role || "N/A",
      department: profile.department || "N/A",
      dob: formatDate(profile.dob),
      bloodGroup: profile.blood_group || "O+",
      joiningDate: formatDate(profile.joining_date),
      validity: calculateValidity(profile.joining_date),
      emergencyName: profile.emergency_contact?.split('-')?.[0]?.trim() || "Kiran Kirdat",
      emergencyRelation: profile.emergency_contact?.split('-')?.[1]?.trim() || "Family",
      emergencyMobile: profile.emergency_contact?.split('-')?.[2]?.trim() || profile.emergency_contact || "+91 98221 12345",
      companyContact: `${companySettings.telephone} | ${companySettings.mobile}`,
      companyEmail: "info@maleehouse.com",
   });

   const handleDownload = async () => {
      if (!frontCardRef.current || !backCardRef.current) return;
      setIsDownloading(true);
      
      try {
         // Temporarily hide edit UI if needed, though they shouldn't be inputs if downloaded
         const frontCanvas = await html2canvas(frontCardRef.current, { scale: 3, useCORS: true });
         const backCanvas = await html2canvas(backCardRef.current, { scale: 3, useCORS: true });

         const pdf = new jsPDF({
            orientation: "portrait",
            unit: "px",
            format: [frontCanvas.width, frontCanvas.height * 2 + 20]
         });

         pdf.addImage(frontCanvas.toDataURL("image/png"), "PNG", 0, 0, frontCanvas.width, frontCanvas.height);
         pdf.addImage(backCanvas.toDataURL("image/png"), "PNG", 0, frontCanvas.height + 20, backCanvas.width, backCanvas.height);
         
         pdf.save(`${editData.firstName}_${editData.lastName}_ID_Card.pdf`);
      } catch (err) {
         console.error("Failed to generate PDF", err);
      } finally {
         setIsDownloading(false);
      }
   };

   const renderField = (label: string, valueKey: keyof typeof editData) => (
      <div className="grid grid-cols-[80px_10px_1fr] gap-0.5">
         <span className="font-bold text-[#102b4e]">{label}</span>
         <span className="font-bold text-[#102b4e]">:</span>
         {isEditing ? (
            <input 
               value={editData[valueKey]} 
               onChange={e => setEditData({...editData, [valueKey]: e.target.value})}
               className="text-gray-800 font-semibold bg-white border border-gray-300 px-1 py-0 h-4 rounded-sm text-[10px] w-full"
            />
         ) : (
            <span className="text-gray-800 font-semibold capitalize">{editData[valueKey]}</span>
         )}
      </div>
   );

   const renderEmergencyField = (label: string, valueKey: keyof typeof editData) => (
      <div className="grid grid-cols-[60px_10px_1fr] gap-0 text-[10px] ml-9">
         <span className="font-bold text-[#102b4e]">{label}</span>
         <span className="font-bold text-[#102b4e]">:</span>
         {isEditing ? (
            <input 
               value={editData[valueKey]} 
               onChange={e => setEditData({...editData, [valueKey]: e.target.value})}
               className="text-gray-700 font-medium bg-white border border-gray-300 px-1 py-0 h-4 rounded-sm w-[90%]"
            />
         ) : (
            <span className="text-gray-700 font-medium">{editData[valueKey]}</span>
         )}
      </div>
   );

   return (
      <div className="flex flex-col items-center w-full">
         <div className="w-full flex justify-end gap-3 mb-4 max-w-[720px]">
            {isEditing ? (
               <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                  <Check className="w-3.5 h-3.5" /> Done
               </button>
            ) : (
               <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                  <Edit2 className="w-3.5 h-3.5" /> Edit ID Fields
               </button>
            )}
            
            <button onClick={handleDownload} disabled={isDownloading} className="px-3 py-1.5 bg-[#102b4e] hover:bg-[#102b4e]/90 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2">
               {isDownloading ? <span className="animate-spin text-lg border-2 border-white border-t-transparent rounded-full w-4 h-4"></span> : <Download className="w-4 h-4" />}
               Download PDF
            </button>
         </div>

         <div className="flex flex-col lg:flex-row gap-5 items-center justify-center">
            {/* Front Card */}
            <div ref={frontCardRef} className="w-[350px] h-[580px] bg-[#f8f9fa] rounded-2xl shadow-2xl overflow-hidden relative flex flex-col border-2 border-gray-100">
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
                           <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" />
                        ) : (
                           <UserIcon className="w-12 h-12 text-gray-400" />
                        )}
                     </div>

                     {/* Details */}
                     <div className="flex flex-col gap-1.5 text-[11px] mt-1 w-full pr-2">
                        {isEditing ? (
                           <div className="grid grid-cols-[80px_10px_1fr] gap-0.5 mb-0.5">
                              <span className="font-bold text-[#102b4e]">Name</span>
                              <span className="font-bold text-[#102b4e]">:</span>
                              <div className="flex gap-1">
                                 <input value={editData.firstName} onChange={e => setEditData({...editData, firstName: e.target.value})} className="text-gray-800 font-semibold bg-white border border-gray-300 px-1 py-0 h-4 rounded-sm text-[10px] w-full" />
                                 <input value={editData.lastName} onChange={e => setEditData({...editData, lastName: e.target.value})} className="text-gray-800 font-semibold bg-white border border-gray-300 px-1 py-0 h-4 rounded-sm text-[10px] w-full" />
                              </div>
                           </div>
                        ) : (
                           <div className="grid grid-cols-[80px_10px_1fr] gap-0.5">
                              <span className="font-bold text-[#102b4e]">Name</span>
                              <span className="font-bold text-[#102b4e]">:</span>
                              <span className="text-gray-800 font-semibold">{editData.firstName} {editData.lastName}</span>
                           </div>
                        )}
                        {renderField("Employee ID", "employeeId")}
                        {renderField("Designation", "designation")}
                        {renderField("Department", "department")}
                        {renderField("Date of Birth", "dob")}
                        {renderField("Blood Group", "bloodGroup")}
                        {renderField("Date of Joining", "joiningDate")}
                        {renderField("Validity", "validity")}
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
                     <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=www.maleehouse.com" className="w-full h-full" alt="QR" crossOrigin="anonymous" />
                  </div>
                  <div className="flex flex-col justify-center">
                     <p className="text-[10px] leading-tight text-gray-300">Empowering Precision,</p>
                     <p className="text-[10px] leading-tight mb-0.5 text-gray-300">Delivering Excellence</p>
                     <p className="text-[11px] font-bold text-white tracking-wide mt-1">www.maleehouse.com</p>
                  </div>
               </div>
            </div>

            {/* Back Card */}
            <div ref={backCardRef} className="w-[350px] h-[580px] bg-[#f8f9fa] rounded-2xl shadow-2xl overflow-hidden relative flex flex-col border-2 border-gray-100">
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
                     <div className="w-full pr-4">
                        <p className="font-bold text-[#102b4e] mb-0.5">Contact</p>
                        {isEditing ? (
                           <input 
                              value={editData.companyContact} 
                              onChange={e => setEditData({...editData, companyContact: e.target.value})}
                              className="text-[10px] text-gray-700 font-medium bg-white border border-gray-300 px-1 py-0 h-4 rounded-sm w-full"
                           />
                        ) : (
                           <p className="text-[10px] text-gray-600 font-medium">{editData.companyContact}</p>
                        )}
                     </div>
                  </div>
                  <div className="flex gap-3 items-start">
                     <div className="text-[#f16821] mt-0.5"><Mail className="w-4 h-4" /></div>
                     <div className="w-full pr-4">
                        <p className="font-bold text-[#102b4e] mb-0.5">Email</p>
                        {isEditing ? (
                           <input 
                              value={editData.companyEmail} 
                              onChange={e => setEditData({...editData, companyEmail: e.target.value})}
                              className="text-[10px] text-gray-700 font-medium bg-white border border-gray-300 px-1 py-0 h-4 rounded-sm w-full"
                           />
                        ) : (
                           <p className="text-[10px] text-gray-600 font-medium">{editData.companyEmail}</p>
                        )}
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
                  {renderEmergencyField("Name", "emergencyName")}
                  {renderEmergencyField("Relation", "emergencyRelation")}
                  {renderEmergencyField("Mobile No.", "emergencyMobile")}

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
      </div>
   );
}
