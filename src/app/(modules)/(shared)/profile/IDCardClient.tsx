"use client";

import React, { useRef, useState } from "react";
import { Download, MapPin, Phone, Mail, Globe, Users, FileText, User as UserIcon } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { cn } from "@/lib/utils";

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
  <svg viewBox="0 0 100 10" className="w-20 h-2 mx-auto mt-1 opacity-85" fill="none" stroke="#d97706" strokeWidth="1">
    <path d="M 10 5 Q 30 2 50 5 T 90 5" />
    <circle cx="50" cy="5" r="2" fill="#d97706" />
  </svg>
);

export default function IDCardClient({ profile: initialProfile, companySettings }: { profile: any, companySettings: any }) {
   const [profile] = useState(initialProfile);
   const [isFlipped, setIsFlipped] = useState(false);
   const frontCardRef = useRef<HTMLDivElement>(null);
   const backCardRef = useRef<HTMLDivElement>(null);
   const [isDownloading, setIsDownloading] = useState(false);

   const formatDate = (dateString?: string) => {
      if (!dateString) return "N/A";
      const d = new Date(dateString);
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
      contactNo: profile.phone_number || profile.mobile || "N/A",
      email: profile.personal_email || profile.email || "N/A",
      emergencyName: profile.emergency_contact?.split('-')?.[0]?.trim() || "Kiran Kirdat",
      emergencyRelation: profile.emergency_contact?.split('-')?.[1]?.trim() || "Family",
      emergencyMobile: profile.emergency_contact?.split('-')?.[2]?.trim() || profile.emergency_contact || "+91 98221 12345",
      companyContact: `${companySettings.telephone || '7385238481'} | ${companySettings.mobile || '9270097679'}`,
      companyEmail: "info@maleehouse.com",
   });

   const handleDownload = async (e: React.MouseEvent) => {
      e.stopPropagation(); // Avoid triggering card flip
      if (!frontCardRef.current || !backCardRef.current) return;
      setIsDownloading(true);

      try {
         // Target the flat print-only reference nodes to avoid 3D transform capture glitches
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

   const renderField = (label: string, value: string) => (
      <div className="grid grid-cols-[90px_10px_1fr] gap-0 mb-2 items-center">
         <span className="font-bold text-gray-500 text-[10px] uppercase tracking-wide">{label}</span>
         <span className="font-bold text-gray-300 text-[10px]">:</span>
         <span className="text-[#0c2e5c] font-bold text-[11.5px] truncate">{value}</span>
      </div>
   );

   const renderBottomField = (icon: React.ReactNode, label: string, value: string) => (
      <div className="flex items-center gap-3">
         <div className="w-6 h-6 rounded-full bg-[#0c2e5c] text-white flex items-center justify-center shrink-0">
            {icon}
         </div>
         <div className="grid grid-cols-[90px_15px_1fr] w-full items-center">
            <span className="font-bold text-gray-500 text-[9.5px] uppercase tracking-wide">{label}</span>
            <span className="font-bold text-gray-300 text-[9.5px]">:</span>
            <span className="text-[#0c2e5c] font-bold text-[10.5px] truncate">{value}</span>
         </div>
      </div>
   );

   const renderEmergencyField = (label: string, value: string) => (
      <div className="grid grid-cols-[70px_10px_1fr] gap-0 text-[10.5px] ml-9 mb-1">
         <span className="font-semibold text-slate-500">{label}</span>
         <span className="font-semibold text-slate-350">:</span>
         <span className="text-[#0c2e5c] font-bold">{value}</span>
      </div>
   );

   // Reusable card content definitions
   const FrontCardContent = () => (
      <>
         {/* Top Header Section */}
         <div className="relative pt-6 pb-2 px-5 flex flex-col items-center bg-white z-10">
            <div className="flex items-center gap-3.5 w-full justify-center">
               <LogoSVG />
               <div className="flex flex-col">
                  <h2 className="text-[#0e3b75] font-extrabold text-[24px] leading-none tracking-tight">Malee House</h2>
                  <p className="text-gray-500 text-[8.5px] font-bold tracking-[0.05em] mt-1 font-sans">We Build Trust With Quality & Service</p>
                  <GoldFlourish />
               </div>
            </div>
         </div>

         {/* Wave Divider with pill banner */}
         <div className="relative h-15 w-full overflow-hidden shrink-0 z-10">
            <svg viewBox="0 0 350 70" className="w-full h-full" preserveAspectRatio="none">
               {/* Blue wave stripe */}
               <path d="M 0,15 Q 175,60 350,15 L 350,35 Q 175,80 0,35 Z" fill="#0070d2" />
               {/* Pink wave stripe */}
               <path d="M 0,22 Q 175,65 350,22 L 350,42 Q 175,82 0,42 Z" fill="#e11d48" />
               {/* Dark blue wave stripe */}
               <path d="M 0,30 Q 175,70 350,30 L 350,52 Q 175,90 0,52 Z" fill="#0c2e5c" />
            </svg>
            
            {/* Identity Card Pill Banner */}
            <div className="absolute top-[28px] left-1/2 -translate-x-1/2 bg-[#0b1b33] text-white text-[9px] font-bold tracking-widest px-8 py-1 rounded-full shadow-md uppercase border border-white/10">
               Identity Card
            </div>
         </div>

         {/* Body */}
         <div className="flex-1 px-5 py-4 flex flex-col justify-between relative bg-white">
            <div className="flex flex-col gap-4 relative z-10 mt-1">
               <div className="flex gap-4 items-center">
                  {/* Profile Photo */}
                  <div className="w-[110px] h-[135px] rounded-2xl overflow-hidden bg-gray-50 border-[3px] border-slate-200 shadow-sm shrink-0 flex items-center justify-center">
                     {profile.profile_photo ? (
                        <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" />
                     ) : (
                        <UserIcon className="w-12 h-12 text-gray-300" />
                     )}
                  </div>

                  {/* Top Details next to Photo */}
                  <div className="flex flex-col justify-center text-[11px] w-full pr-1">
                     <div className="grid grid-cols-[90px_10px_1fr] gap-0 mb-2 items-start">
                        <span className="font-bold text-gray-500 text-[10px] uppercase tracking-wide mt-0.5">Name</span>
                        <span className="font-bold text-gray-300 text-[10px] mt-0.5">:</span>
                        <span className="text-[#0c2e5c] font-black text-[12.5px] leading-tight capitalize">{editData.firstName} {editData.lastName}</span>
                     </div>
                     {renderField("Employee ID", editData.employeeId)}
                     <div className="grid grid-cols-[90px_10px_1fr] gap-0 mb-2 items-center">
                        <span className="font-bold text-gray-500 text-[10px] uppercase tracking-wide">Designation</span>
                        <span className="font-bold text-gray-300 text-[10px]">:</span>
                        <span className="text-[#0c2e5c] font-bold text-[11px] capitalize">{editData.designation}</span>
                     </div>
                     <div className="grid grid-cols-[90px_10px_1fr] gap-0 mb-2 items-center">
                        <span className="font-bold text-gray-500 text-[10px] uppercase tracking-wide">Department</span>
                        <span className="font-bold text-gray-300 text-[10px]">:</span>
                        <span className="text-[#0c2e5c] font-bold text-[11px] uppercase">{editData.department}</span>
                     </div>
                  </div>
               </div>

               {/* Details Card Container */}
               <div className="flex flex-col bg-white rounded-[20px] p-4 border border-slate-100 shadow-sm gap-3 mt-1">
                  {renderBottomField(<FileText className="w-3.5 h-3.5" />, "D.O.B.", editData.dob)}
                  {renderBottomField(<FileText className="w-3.5 h-3.5" />, "Joined Date", editData.joiningDate)}
                  {renderBottomField(<Phone className="w-3.5 h-3.5" />, "Contact No.", editData.contactNo)}
                  {renderBottomField(<Mail className="w-3.5 h-3.5" />, "Email", editData.email)}
               </div>
            </div>

            {/* Stamp & Authorized Signature */}
            <div className="mt-auto flex justify-between items-end relative z-10 pb-1">
               <div className="flex flex-col items-start pl-2">
                  <div className="h-8 border-b border-slate-300 w-28 mb-1 flex items-end justify-center">
                     <span className="font-serif text-[17px] text-slate-800 italic pr-2 leading-none">{editData.firstName} {editData.lastName}</span>
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
      </>
   );

   const BackCardContent = () => (
      <>
         {/* Top Header Section */}
         <div className="relative pt-6 pb-2 px-5 flex flex-col items-center bg-white z-10">
            <div className="flex items-center gap-3.5 w-full justify-center">
               <LogoSVG />
               <div className="flex flex-col">
                  <h2 className="text-[#0e3b75] font-extrabold text-[24px] leading-none tracking-tight">Malee House</h2>
                  <p className="text-gray-500 text-[8.5px] font-bold tracking-[0.05em] mt-1 font-sans">We Build Trust With Quality & Service</p>
                  <GoldFlourish />
               </div>
            </div>
         </div>

         {/* Wave Divider */}
         <div className="relative h-12 w-full overflow-hidden shrink-0 z-10">
            <svg viewBox="0 0 350 50" className="w-full h-full" preserveAspectRatio="none">
               {/* Blue wave stripe */}
               <path d="M 0,15 Q 175,55 350,15 L 350,30 Q 175,70 0,30 Z" fill="#0070d2" />
               {/* Pink wave stripe */}
               <path d="M 0,22 Q 175,59 350,22 L 350,34 Q 175,71 0,34 Z" fill="#e11d48" />
            </svg>
         </div>

         {/* Body */}
         <div className="flex-1 px-5 py-4 flex flex-col gap-4 text-xs relative text-gray-800 bg-white justify-between">
            {/* Contact details with themed circles */}
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
                     <p className="text-[10.5px] text-slate-700 font-bold">{editData.companyContact}</p>
                  </div>
               </div>
               <div className="flex gap-4 items-start">
                  <div className="text-white bg-[#0070d2] w-6.5 h-6.5 rounded-full flex items-center justify-center shadow-sm shrink-0"><Mail className="w-3.5 h-3.5" /></div>
                  <div className="w-full pr-4">
                     <p className="font-bold text-[#0070d2] text-[10px] mb-0.5 tracking-wider">EMAIL</p>
                     <p className="text-[10.5px] text-[#0c2e5c] font-bold">{editData.companyEmail}</p>
                  </div>
               </div>
               <div className="flex gap-4 items-start">
                  <div className="text-white bg-[#e11d48] w-6.5 h-6.5 rounded-full flex items-center justify-center shadow-sm shrink-0"><Globe className="w-3.5 h-3.5" /></div>
                  <div>
                     <p className="font-bold text-[#0070d2] text-[10px] mb-0.5 tracking-wider">WEBSITE</p>
                     <p className="text-[10.5px] text-[#0c2e5c] font-bold">www.maleehouse.com</p>
                  </div>
               </div>
            </div>

            <hr className="border-slate-100" />

            {/* Emergency Contact Section */}
            <div className="relative z-10 flex flex-col gap-1.5">
               <div className="bg-[#0070d2] text-white flex items-center gap-2 px-4 py-1 rounded-full w-max text-[8.5px] font-bold tracking-widest uppercase shadow-sm">
                  <Users className="w-3 h-3" />
                  <span>Emergency Contact</span>
               </div>
               {renderEmergencyField("Name", editData.emergencyName)}
               {renderEmergencyField("Relation", editData.emergencyRelation)}
               {renderEmergencyField("Mobile No.", editData.emergencyMobile)}
            </div>

            {/* Terms & Conditions Section */}
            <div className="relative z-10">
               <div className="bg-[#0070d2] text-white flex items-center gap-2 px-4 py-1 rounded-full w-max text-[8.5px] font-bold tracking-widest uppercase shadow-sm mb-2">
                  <FileText className="w-3 h-3" />
                  <span>Terms & Conditions</span>
               </div>
               <ol className="list-decimal pl-5 pr-1 text-[9px] text-slate-500 font-semibold space-y-1 leading-snug">
                  <li>This card is the property of Malee House Survey & Mapping Services.</li>
                  <li>This card must be carried during office hours and field visits.</li>
                  <li>Loss of card should be reported immediately.</li>
               </ol>
            </div>

            {/* Themed Center Footer */}
            <div className="bg-[#0070d2] py-2.5 text-center text-white text-[8px] font-bold tracking-widest shrink-0 uppercase">
               — WE BUILD TRUST WITH QUALITY & SERVICE —
            </div>
         </div>
      </>
   );

   return (
      <div className="flex flex-col items-center w-full">
         
         {/* Action Bar with Download Trigger */}
         <div className="w-full flex justify-end gap-3 mb-6 max-w-[350px]">
            <button 
               onClick={handleDownload} 
               disabled={isDownloading} 
               className="px-4 py-2 bg-gradient-to-r from-[#0c2e5c] to-[#0b1b33] hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
               {isDownloading ? (
                  <span className="animate-spin text-lg border-2 border-white border-t-transparent rounded-full w-3.5 h-3.5"></span>
               ) : (
                  <Download className="w-3.5 h-3.5" />
               )}
               Download PDF
            </button>
         </div>

         {/* Interactive Flip Card Frame */}
         <div 
            onClick={() => setIsFlipped(!isFlipped)} 
            className="w-[350px] h-[580px] cursor-pointer group [perspective:1000px] select-none"
            title="Click to flip card"
         >
            <div className={cn(
               "relative w-full h-full duration-700 [transform-style:preserve-3d]",
               isFlipped ? "[transform:rotateY(180deg)]" : ""
            )}>
               {/* Front Side */}
               <div className="absolute inset-0 w-full h-full [backface-visibility:hidden]">
                  <div className="w-full h-full bg-[#fdfdfd] rounded-[24px] shadow-2xl flex flex-col border border-gray-150/80 overflow-hidden">
                     <FrontCardContent />
                  </div>
               </div>
               
               {/* Back Side */}
               <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <div className="w-full h-full bg-[#fdfdfd] rounded-[24px] shadow-2xl flex flex-col border border-gray-150/80 overflow-hidden">
                     <BackCardContent />
                  </div>
               </div>
            </div>
         </div>

         {/* ── Bulletproof PDF Export References ── */}
         {/* Rendered flat side-by-side in hidden container to allow HTML2Canvas to capture without 3D rotation bugs */}
         <div className="absolute left-[-9999px] top-[-9999px] flex gap-5 pointer-events-none">
            <div 
               ref={frontCardRef} 
               className="w-[350px] h-[580px] bg-[#fdfdfd] rounded-[24px] flex flex-col border border-gray-150/80 overflow-hidden"
            >
               <FrontCardContent />
            </div>
            <div 
               ref={backCardRef} 
               className="w-[350px] h-[580px] bg-[#fdfdfd] rounded-[24px] flex flex-col border border-gray-150/80 overflow-hidden"
            >
               <BackCardContent />
            </div>
         </div>

      </div>
   );
}
