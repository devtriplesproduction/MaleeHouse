"use client";

import React, { useRef, useState } from "react";
import { Download, MapPin, Phone, Mail, Globe, Users, FileText, User as UserIcon } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const LogoSVG = () => (
  <svg viewBox="0 0 100 100" className="w-12 h-12 flex-shrink-0">
    {/* Compass Points */}
    {/* Main Points (Red) */}
    <polygon points="50,12 55,45 50,50 45,45" fill="#e11d48" />
    <polygon points="50,88 55,55 50,50 45,55" fill="#be123c" />
    <polygon points="88,50 55,45 50,50 55,55" fill="#e11d48" />
    <polygon points="12,50 45,45 50,50 45,55" fill="#be123c" />
    {/* Diagonal Points (Orange/Yellow) */}
    <polygon points="23,23 47,47 50,50 43,43" fill="#fbbf24" />
    <polygon points="77,77 53,53 50,50 57,57" fill="#d97706" />
    <polygon points="77,23 53,47 50,50 57,43" fill="#fbbf24" />
    <polygon points="23,77 47,53 50,50 43,57" fill="#d97706" />
    {/* Center circle */}
    <circle cx="50" cy="50" r="19" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" />
    {/* Stylized m in white */}
    <text x="50" y="56" fontFamily="serif" fontSize="19" fontWeight="bold" fontStyle="italic" fill="white" textAnchor="middle">m</text>
  </svg>
);

const GoldFlourish = () => (
  <svg viewBox="0 0 100 10" className="w-16 h-1.5 mx-auto mt-1 opacity-70" fill="none" stroke="#d97706" strokeWidth="1.5">
    <path d="M 10 5 Q 30 2 50 5 T 90 5" />
    <circle cx="50" cy="5" r="1.5" fill="#d97706" />
  </svg>
);

export default function IDCardClient({ profile: initialProfile, companySettings }: { profile: any, companySettings: any }) {
   const [profile] = useState(initialProfile);
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

   // Card data binding state
   const [editData] = useState({
      firstName: profile.first_name || "",
      lastName: profile.last_name || "",
      employeeId: profile.employee_id || "N/A",
      designation: profile.designation?.replace('_', ' ') || profile.role || "N/A",
      department: profile.department || "N/A",
      dob: formatDate(profile.dob),
      joiningDate: formatDate(profile.joining_date),
      validity: calculateValidity(profile.joining_date),
      contactNo: profile.phone_number || profile.mobile || "N/A",
      email: profile.personal_email || profile.email || "N/A",
      emergencyName: profile.emergency_contact?.split('-')?.[0]?.trim() || "Kiran Kirdat",
      emergencyRelation: profile.emergency_contact?.split('-')?.[1]?.trim() || "Family",
      emergencyMobile: profile.emergency_contact?.split('-')?.[2]?.trim() || profile.emergency_contact || "+91 98221 12345",
      companyContact: `${companySettings.telephone || '7385238481'} | ${companySettings.mobile || '9270097679'}`,
      companyEmail: "info@maleehouse.com",
   });

   const handleDownload = async () => {
      if (!frontCardRef.current || !backCardRef.current) return;
      setIsDownloading(true);

      try {
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
      <div className="grid grid-cols-[95px_10px_1fr] gap-0 mb-1.5 items-center">
         <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">{label}</span>
         <span className="font-bold text-slate-300 text-[10px]">:</span>
         <span className="text-[#0c2e5c] font-bold text-[10.5px] truncate">{editData[valueKey]}</span>
      </div>
   );

   const renderEmergencyField = (label: string, valueKey: keyof typeof editData) => (
      <div className="grid grid-cols-[70px_10px_1fr] gap-0 text-[10.5px] ml-9 mb-1">
         <span className="font-semibold text-slate-500">{label}</span>
         <span className="font-semibold text-slate-300">:</span>
         <span className="text-[#0c2e5c] font-bold">{editData[valueKey]}</span>
      </div>
   );

   return (
      <div className="flex flex-col items-center w-full pb-10">
         <div className="w-full flex justify-end gap-3 mb-6 max-w-[720px]">
            <button onClick={handleDownload} disabled={isDownloading} className="px-4 py-1.5 bg-gradient-to-r from-[#0c2e5c] to-[#0b1b33] hover:opacity-90 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm">
               {isDownloading ? <span className="animate-spin text-lg border-2 border-white border-t-transparent rounded-full w-4 h-4"></span> : <Download className="w-4 h-4" />}
               Download PDF
            </button>
         </div>

         <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
            {/* Front Card */}
            <div ref={frontCardRef} className="w-[350px] h-[580px] bg-white rounded-[24px] shadow-2xl overflow-hidden relative flex flex-col border border-gray-150/80">
               {/* Top Header Area */}
               <div className="relative pt-6 pb-2 px-5 flex flex-col items-center bg-white z-10">
                  <div className="flex items-center gap-3 w-full justify-center">
                     <LogoSVG />
                     <div className="flex flex-col">
                        <h2 className="text-[#0e3b75] font-extrabold text-[24px] leading-none tracking-tight">Malee House</h2>
                        <p className="text-gray-500 text-[8.5px] font-bold tracking-[0.05em] mt-1 font-sans">We Build Trust With Quality & Service</p>
                        <GoldFlourish />
                     </div>
                  </div>
               </div>

               {/* Curved Divider & Identity Card Pill */}
               <div className="relative h-14 w-full flex items-center justify-center overflow-hidden shrink-0">
                  {/* Accent Curve Bottom Layers */}
                  <div className="absolute top-0 inset-x-0 h-10 bg-[#0070d2] rounded-b-[40%] z-0"></div>
                  <div className="absolute top-1 inset-x-0 h-10 bg-[#e11d48] rounded-b-[40%] z-0"></div>
                  <div className="absolute top-2 inset-x-0 h-12 bg-[#0c2e5c] rounded-b-[45%] z-0"></div>
                  
                  {/* Identity Card Banner */}
                  <div className="bg-[#0b1b33] text-white text-[9px] font-bold tracking-widest px-8 py-1.5 rounded-full z-10 shadow-sm uppercase border border-white/5 mt-2">
                     Identity Card
                  </div>
               </div>

               {/* Body */}
               <div className="flex-1 px-5 py-5 flex flex-col justify-between relative bg-white">
                  <div className="flex flex-col gap-4 relative z-10">
                     <div className="flex gap-4 items-center">
                        {/* Profile Photo */}
                        <div className="w-[115px] h-[140px] rounded-2xl overflow-hidden bg-gray-50 border-[3.5px] border-slate-200 shadow-sm shrink-0 flex items-center justify-center">
                           <div className="w-full h-full rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                              {profile.profile_photo ? (
                                 <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" />
                              ) : (
                                 <UserIcon className="w-12 h-12 text-gray-300" />
                              )}
                           </div>
                        </div>

                        {/* Top Details (Name, ID, etc.) */}
                        <div className="flex flex-col justify-center text-[11px] w-full pr-1">
                           <div className="grid grid-cols-[85px_10px_1fr] gap-0 mb-2 items-start">
                              <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider mt-0.5">Name</span>
                              <span className="font-bold text-slate-300 text-[10px] mt-0.5">:</span>
                              <span className="text-[#0c2e5c] font-extrabold text-[13px] leading-tight capitalize">{editData.firstName} {editData.lastName}</span>
                           </div>
                           <div className="grid grid-cols-[85px_10px_1fr] gap-0 mb-2 items-center">
                              <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Employee ID</span>
                              <span className="font-bold text-slate-300 text-[10px]">:</span>
                              <span className="text-[#0c2e5c] font-extrabold text-[11px]">{editData.employeeId}</span>
                           </div>
                           <div className="grid grid-cols-[85px_10px_1fr] gap-0 mb-2 items-center">
                              <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Designation</span>
                              <span className="font-bold text-slate-300 text-[10px]">:</span>
                              <span className="text-[#0c2e5c] font-extrabold text-[11px] capitalize">{editData.designation}</span>
                           </div>
                           <div className="grid grid-cols-[85px_10px_1fr] gap-0 mb-2 items-center">
                              <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Department</span>
                              <span className="font-bold text-slate-300 text-[10px]">:</span>
                              <span className="text-[#0c2e5c] font-extrabold text-[11px] uppercase">{editData.department}</span>
                           </div>
                        </div>
                     </div>

                     {/* Bottom Card Fields list with circular icon indicators */}
                     <div className="flex flex-col bg-slate-50/50 rounded-2xl p-3.5 border border-slate-100/80 shadow-sm gap-2.5 mt-1">
                        <div className="flex items-center gap-3">
                           <div className="w-6 h-6 rounded-full bg-[#0c2e5c] text-white flex items-center justify-center shrink-0">
                              <UserIcon className="w-3.5 h-3.5" />
                           </div>
                           {renderField("D.O.B.", "dob")}
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="w-6 h-6 rounded-full bg-[#0c2e5c] text-white flex items-center justify-center shrink-0">
                              <FileText className="w-3.5 h-3.5" />
                           </div>
                           {renderField("Joined Date", "joiningDate")}
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="w-6 h-6 rounded-full bg-[#0c2e5c] text-white flex items-center justify-center shrink-0">
                              <FileText className="w-3.5 h-3.5" />
                           </div>
                           {renderField("Validity", "validity")}
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="w-6 h-6 rounded-full bg-[#0c2e5c] text-white flex items-center justify-center shrink-0">
                              <Phone className="w-3.5 h-3.5" />
                           </div>
                           {renderField("Contact No.", "contactNo")}
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="w-6 h-6 rounded-full bg-[#0c2e5c] text-white flex items-center justify-center shrink-0">
                              <Mail className="w-3.5 h-3.5" />
                           </div>
                           {renderField("Email", "email")}
                        </div>
                     </div>
                  </div>

                  {/* Signatures & Bottom Curve */}
                  <div className="mt-auto flex justify-between items-end relative z-10 pb-1 pt-4">
                     <div className="flex flex-col items-start pl-2">
                        <div className="h-8 border-b border-slate-350 w-28 mb-1 flex items-end justify-center">
                           <span className="font-serif text-[17px] text-gray-800 italic pr-2 leading-none">{editData.firstName} {editData.lastName}</span>
                        </div>
                        <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wide">Authorized Signature</span>
                     </div>
                  </div>

                  {/* Bottom Right Wave */}
                  <div className="absolute bottom-0 right-0 w-36 h-20 overflow-hidden pointer-events-none z-0">
                     <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                        <path d="M0,100 C40,90 60,60 100,50 L100,100 Z" fill="#e11d48" opacity="0.85" />
                        <path d="M20,100 C50,90 70,75 100,65 L100,100 Z" fill="#0070d2" />
                        <path d="M40,100 C65,95 80,85 100,75 L100,100 Z" fill="#0c2e5c" />
                     </svg>
                  </div>
               </div>
            </div>

            {/* Back Card */}
            <div ref={backCardRef} className="w-[350px] h-[580px] bg-white rounded-[24px] shadow-2xl overflow-hidden relative flex flex-col border border-gray-150/80">
               {/* Top Header Area */}
               <div className="relative pt-6 pb-2 px-5 flex flex-col items-center bg-white z-10">
                  <div className="flex items-center gap-3 w-full justify-center">
                     <LogoSVG />
                     <div className="flex flex-col">
                        <h2 className="text-[#0e3b75] font-extrabold text-[24px] leading-none tracking-tight">Malee House</h2>
                        <p className="text-gray-500 text-[8.5px] font-bold tracking-[0.05em] mt-1 font-sans">We Build Trust With Quality & Service</p>
                        <GoldFlourish />
                     </div>
                  </div>
               </div>

               {/* Curved Divider */}
               <div className="relative h-14 w-full flex items-center justify-center overflow-hidden shrink-0">
                  <div className="absolute top-0 inset-x-0 h-10 bg-[#0070d2] rounded-b-[40%] z-0"></div>
                  <div className="absolute top-1 inset-x-0 h-10 bg-[#e11d48] rounded-b-[40%] z-0"></div>
                  <div className="absolute top-2 inset-x-0 h-12 bg-[#0c2e5c] rounded-b-[45%] z-0"></div>
               </div>

               {/* Body */}
               <div className="flex-1 px-5 py-4 flex flex-col gap-4 text-xs relative text-gray-800 bg-white justify-between">
                  {/* Contact details with custom themed circle icons */}
                  <div className="flex flex-col gap-3.5 relative z-10 mt-1">
                     <div className="flex gap-4 items-start">
                        <div className="text-white bg-[#e11d48] w-6.5 h-6.5 rounded-full flex items-center justify-center shadow-sm shrink-0"><MapPin className="w-3.5 h-3.5" /></div>
                        <div>
                           <p className="font-bold text-[#0070d2] text-[10px] mb-0.5 tracking-wider">OFFICE ADDRESS</p>
                           <p className="text-[10px] text-slate-600 font-semibold leading-relaxed pr-2">Malee House, Flat No.1, Wimbledon Building, In front of Azad College, D.G College Chowk, Satara, MAHARASHTRA 415002</p>
                        </div>
                     </div>
                     <div className="flex gap-4 items-start">
                        <div className="text-white bg-[#fbbf24] w-6.5 h-6.5 rounded-full flex items-center justify-center shadow-sm shrink-0"><Phone className="w-3.5 h-3.5" /></div>
                        <div className="w-full pr-4">
                           <p className="font-bold text-[#0070d2] text-[10px] mb-0.5 tracking-wider">CONTACT</p>
                           <p className="text-[10px] text-slate-650 font-bold">{editData.companyContact}</p>
                        </div>
                     </div>
                     <div className="flex gap-4 items-start">
                        <div className="text-white bg-[#0070d2] w-6.5 h-6.5 rounded-full flex items-center justify-center shadow-sm shrink-0"><Mail className="w-3.5 h-3.5" /></div>
                        <div className="w-full pr-4">
                           <p className="font-bold text-[#0070d2] text-[10px] mb-0.5 tracking-wider">EMAIL</p>
                           <p className="text-[10px] text-[#0c2e5c] font-bold">{editData.companyEmail}</p>
                        </div>
                     </div>
                     <div className="flex gap-4 items-start">
                        <div className="text-white bg-[#e11d48] w-6.5 h-6.5 rounded-full flex items-center justify-center shadow-sm shrink-0"><Globe className="w-3.5 h-3.5" /></div>
                        <div>
                           <p className="font-bold text-[#0070d2] text-[10px] mb-0.5 tracking-wider">WEBSITE</p>
                           <p className="text-[10px] text-[#0c2e5c] font-bold">www.maleehouse.com</p>
                        </div>
                     </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Emergency Contact */}
                  <div className="relative z-10 flex flex-col gap-1.5">
                     <div className="bg-[#0070d2] text-white flex items-center gap-2 px-4 py-1.5 rounded-full w-max text-[8.5px] font-bold tracking-widest uppercase shadow-sm">
                        <Users className="w-3 h-3" />
                        <span>Emergency Contact</span>
                     </div>
                     {renderEmergencyField("Name", "emergencyName")}
                     {renderEmergencyField("Relation", "emergencyRelation")}
                     {renderEmergencyField("Mobile No.", "emergencyMobile")}
                  </div>

                  {/* Terms & Conditions */}
                  <div className="relative z-10 mt-1 mb-2">
                     <div className="bg-[#0070d2] text-white flex items-center gap-2 px-4 py-1.5 rounded-full w-max text-[8.5px] font-bold tracking-widest uppercase shadow-sm mb-2">
                        <FileText className="w-3 h-3" />
                        <span>Terms & Conditions</span>
                     </div>
                     <ol className="list-decimal pl-5 pr-1 text-[9px] text-slate-500 font-semibold space-y-1.5 leading-snug">
                        <li>This card is the property of Malee House Survey & Mapping Services.</li>
                        <li>This card must be carried during office hours and field visits.</li>
                        <li>Loss of card should be reported immediately.</li>
                     </ol>
                  </div>

                  {/* Footer */}
                  <div className="bg-[#0070d2] py-2.5 text-center text-white text-[8px] font-bold tracking-widest shrink-0 uppercase">
                     — WE BUILD TRUST WITH QUALITY & SERVICE —
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
