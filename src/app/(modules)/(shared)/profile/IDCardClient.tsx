"use client";

import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download, MapPin, Phone, Mail, Globe, Users, FileText, User as UserIcon } from "lucide-react";
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
    <text x="50" y="56" fontFamily="sans-serif" fontSize="19" fontWeight="bold" fontStyle="italic" fill="white" textAnchor="middle">m</text>
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


   const formatDate = (dateString?: string) => {
      if (!dateString) return "N/A";
      const d = new Date(dateString);
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
   };

   // Robust emergency contact parser
   const parseEmergencyContact = (contactStr?: string) => {
      const defaultContact = { name: "Kiran Kirdat", relation: "Family", mobile: "+91 98221 12345" };
      if (!contactStr) return defaultContact;
      const parts = contactStr.split('-').map(p => p.trim());
      if (parts.length >= 3) {
         return { name: parts[0], relation: parts[1], mobile: parts[2] };
      } else if (parts.length === 2) {
         const isMobileFirst = /^\+?[\d\s]+$/.test(parts[0]);
         if (isMobileFirst) {
            return { name: "Kiran Kirdat", relation: parts[1], mobile: parts[0] };
         } else {
            return { name: parts[0], relation: "Family", mobile: parts[1] };
         }
      }
      return { name: "Kiran Kirdat", relation: "Family", mobile: contactStr };
   };

   const emergency = parseEmergencyContact(profile.emergency_contact);

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
      emergencyName: emergency.name,
      emergencyRelation: emergency.relation,
      emergencyMobile: emergency.mobile,
      companyContact: `${companySettings.telephone || '7385238481'} | ${companySettings.mobile || '9270097679'}`,
      companyEmail: "info@maleehouse.com",
   });

   const [isDownloading, setIsDownloading] = useState(false);

   const handleDownload = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!frontCardRef.current || !backCardRef.current) return;
      setIsDownloading(true);

      try {
         // Temporarily remove scaling from cards for accurate capture
         const frontElement = frontCardRef.current;
         const backElement = backCardRef.current;
         const originalFrontTransform = frontElement.style.transform;
         const originalBackTransform = backElement.style.transform;
         frontElement.style.transform = 'none';
         backElement.style.transform = 'none';

         // We use onclone to inject a real DOM image for the profile photo to avoid CORS tainting
         let photoDataUrl = "";
         if (profile.profile_photo) {
            try {
               const res = await fetch(profile.profile_photo);
               const blob = await res.blob();
               photoDataUrl = await new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(blob);
               });
            } catch (err) {
               console.error("Failed to fetch photo for PDF", err);
            }
         }

         const canvasOptions = {
            scale: 4, // High resolution
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            onclone: (clonedDoc: Document) => {
               if (photoDataUrl) {
                  const imgs = clonedDoc.querySelectorAll('img');
                  imgs.forEach((img) => {
                     if (img.src.includes(profile.profile_photo)) {
                        img.src = photoDataUrl;
                        img.srcset = "";
                     }
                  });
               }
            }
         };

         const frontCanvas = await html2canvas(frontElement, canvasOptions);
         const backCanvas = await html2canvas(backElement, canvasOptions);

         // Restore original scaling
         frontElement.style.transform = originalFrontTransform;
         backElement.style.transform = originalBackTransform;

         const frontImgData = frontCanvas.toDataURL('image/jpeg', 1.0);
         const backImgData = backCanvas.toDataURL('image/jpeg', 1.0);

         // Create landscape A4 PDF
         const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
         });

         const pageWidth = pdf.internal.pageSize.getWidth(); // 297mm for A4 landscape
         const pageHeight = pdf.internal.pageSize.getHeight(); // 210mm for A4 landscape

         // Card dimensions in pixels: 380x580.
         // Increase physical size to make them larger: height = 130mm
         const targetHeight = 130; 
         const targetWidth = targetHeight * (380 / 580); // ~85.17mm
         
         // Calculate positions to perfectly center them side-by-side
         const gap = 15; // 15mm gap between cards
         const totalWidth = (targetWidth * 2) + gap;
         
         const startX = (pageWidth - totalWidth) / 2;
         const startY = (pageHeight - targetHeight) / 2;

         pdf.addImage(frontImgData, 'JPEG', startX, startY, targetWidth, targetHeight);
         pdf.addImage(backImgData, 'JPEG', startX + targetWidth + gap, startY, targetWidth, targetHeight);

         pdf.save(`${editData.firstName}_${editData.lastName}_ID_Card.pdf`);
      } catch (error) {
         console.error('Error generating PDF:', error);
         alert('Failed to generate PDF. Please try again.');
      } finally {
         setIsDownloading(false);
      }
   };

   const renderField = (label: string, value: string) => (
      <div className="grid grid-cols-[80px_10px_1fr] gap-0 mb-1.5 items-center font-sans">
         <span className="font-bold text-gray-455 text-[10px] uppercase tracking-wider">{label}</span>
         <span className="font-bold text-gray-300 text-[10px]">:</span>
         <span className="text-[#0c2e5c] font-semibold text-[11px] capitalize break-words">{value}</span>
      </div>
   );

   const renderBottomField = (icon: React.ReactNode, label: string, value: string) => (
      <div className="flex items-center gap-3 font-sans">
         <div className="w-6 h-6 rounded-full bg-[#0c2e5c] text-white flex items-center justify-center shrink-0">
            {icon}
         </div>
         <div className="grid grid-cols-[80px_10px_1fr] w-full items-center">
            <span className="font-bold text-gray-455 text-[9.5px] uppercase tracking-wider">{label}</span>
            <span className="font-bold text-gray-300 text-[9.5px]">:</span>
            <span className="text-[#0c2e5c] font-semibold text-[10.5px] break-all">{value}</span>
         </div>
      </div>
   );

   const renderEmergencyField = (label: string, value: string) => (
      <div className="grid grid-cols-[70px_10px_1fr] gap-0 text-[10.5px] ml-9 mb-0.5 font-sans">
         <span className="font-semibold text-slate-400">{label}</span>
         <span className="font-semibold text-slate-350">:</span>
         <span className="text-[#0c2e5c] font-bold break-words">{value}</span>
      </div>
   );

   // Reusable card content definitions
   const FrontCardContent = () => (
      <div className="font-sans relative w-full h-full select-none animate-fade-in" style={{ backgroundImage: "url('/id-card-bg.png')", backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
         {/* Google Font Link for Signature Handwriting style */}
         <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" rel="stylesheet" />

         {/* Top Details container overlay */}
         <div className="absolute top-[148px] left-[25px] right-[25px] flex gap-4 items-center">
            {/* Profile Photo */}
            <div className="w-[108px] h-[130px] rounded-2xl overflow-hidden bg-gray-50 border-[3px] border-slate-200 shadow-sm shrink-0 flex items-center justify-center">
               {profile.profile_photo ? (
                  <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" />
               ) : (
                  <UserIcon className="w-12 h-12 text-gray-300" />
               )}
            </div>

            {/* Top Details next to Photo */}
            <div className="flex flex-col justify-center text-[11px] w-full pr-1">
               <div className="grid grid-cols-[80px_10px_1fr] gap-0 mb-1.5 items-start">
                  <span className="font-bold text-gray-455 text-[10px] uppercase tracking-wider mt-0.5">Name</span>
                  <span className="font-bold text-gray-300 text-[10px] mt-0.5">:</span>
                  <span className="text-[#0c2e5c] font-bold text-[13.5px] leading-tight capitalize break-words">{editData.firstName} {editData.lastName}</span>
               </div>
               {renderField("Employee ID", editData.employeeId)}
               {renderField("Designation", editData.designation)}
               {renderField("Department", editData.department)}
            </div>
         </div>

         {/* Bottom Details Card Container overlay */}
         <div className="absolute top-[292px] left-[25px] right-[25px] flex flex-col bg-white rounded-[20px] p-3.5 border border-slate-100 shadow-sm gap-2.5">
            {renderBottomField(<FileText className="w-3.5 h-3.5" />, "D.O.B.", editData.dob)}
            {renderBottomField(<FileText className="w-3.5 h-3.5" />, "Joined Date", editData.joiningDate)}
            {renderBottomField(<Phone className="w-3.5 h-3.5" />, "Contact No.", editData.contactNo)}
            {renderBottomField(<Mail className="w-3.5 h-3.5" />, "Email", editData.email)}
         </div>

         {/* Stamp & Authorized Signature overlay */}
         <div className="absolute bottom-[28px] left-[25px] flex flex-col items-start pl-2">
            <div className="h-8 border-b border-slate-300 w-28 mb-1 flex items-end justify-center">
               <span className="text-[20px] text-slate-800 pr-2 leading-none" style={{ fontFamily: "'Dancing Script', 'Caveat', 'Brush Script MT', cursive" }}>{editData.firstName} {editData.lastName}</span>
            </div>
            <span className="text-[7.5px] text-gray-400 font-bold uppercase tracking-wider">Authorized Signature</span>
         </div>
      </div>
   );

   const BackCardContent = () => (
      <div className="font-sans relative w-full h-full select-none" style={{ backgroundImage: "url('/id-card-bg-back.png')", backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
         {/* Body content flowing naturally inside the blank middle area */}
         <div className="absolute top-[140px] left-[24px] right-[24px] bottom-[36px] flex flex-col gap-2 text-gray-800">
            {/* Contact details with themed circles */}
            <div className="flex flex-col gap-2 relative z-10 mt-2">
               <div className="flex gap-3.5 items-center">
                  <div className="text-white bg-[#e11d48] w-6.5 h-6.5 rounded-full flex items-center justify-center shadow-sm shrink-0"><MapPin className="w-3.5 h-3.5" /></div>
                  <div>
                     <p className="font-bold text-[#0070d2] text-[9.5px] mb-0.5 tracking-wider">OFFICE ADDRESS</p>
                     <p className="text-[10px] text-slate-650 font-semibold leading-relaxed pr-2">Malee House, Flat No.1, Wimbledon Building, In front of Azad College, D.G College Chowk, Satara, MAHARASHTRA 415002</p>
                  </div>
               </div>
               <div className="flex gap-3.5 items-center">
                  <div className="text-white bg-[#fbbf24] w-6.5 h-6.5 rounded-full flex items-center justify-center shadow-sm shrink-0"><Phone className="w-3.5 h-3.5" /></div>
                  <div className="w-full pr-4">
                     <p className="font-bold text-[#0070d2] text-[9.5px] mb-0.5 tracking-wider">CONTACT</p>
                     <p className="text-[11px] text-slate-700 font-bold">{editData.companyContact}</p>
                  </div>
               </div>
               <div className="flex gap-3.5 items-center">
                  <div className="text-white bg-[#0070d2] w-6.5 h-6.5 rounded-full flex items-center justify-center shadow-sm shrink-0"><Mail className="w-3.5 h-3.5" /></div>
                  <div className="w-full pr-4">
                     <p className="font-bold text-[#0070d2] text-[9.5px] mb-0.5 tracking-wider">EMAIL</p>
                     <p className="text-[11px] text-[#0c2e5c] font-bold">{editData.companyEmail}</p>
                  </div>
               </div>
               <div className="flex gap-3.5 items-center">
                  <div className="text-white bg-[#e11d48] w-6.5 h-6.5 rounded-full flex items-center justify-center shadow-sm shrink-0"><Globe className="w-3.5 h-3.5" /></div>
                  <div>
                     <p className="font-bold text-[#0070d2] text-[9.5px] mb-0.5 tracking-wider">WEBSITE</p>
                     <p className="text-[11px] text-[#0c2e5c] font-bold font-sans">www.maleehouse.com</p>
                  </div>
               </div>
            </div>

            {/* Emergency Contact Section */}
            <div className="relative z-10 flex flex-col gap-1.5">
               <div className="bg-[#0070d2] text-white flex items-center gap-2 px-4 py-1 rounded-full w-max text-[8.5px] font-bold tracking-widest uppercase shadow-sm">
                  <Users className="w-2.5 h-2.5" />
                  <span>Emergency Contact</span>
               </div>
               {renderEmergencyField("Name", editData.emergencyName)}
               {renderEmergencyField("Relation", editData.emergencyRelation)}
               {renderEmergencyField("Mobile No.", editData.emergencyMobile)}
            </div>

            {/* Terms & Conditions Section */}
            <div className="relative z-10">
               <div className="bg-[#0070d2] text-white flex items-center gap-2 px-4 py-1 rounded-full w-max text-[8.5px] font-bold tracking-widest uppercase shadow-sm mb-2">
                  <FileText className="w-2.5 h-2.5" />
                  <span>Terms & Conditions</span>
               </div>
               <ol className="list-decimal pl-5 pr-1 text-[9px] text-slate-500 font-semibold space-y-0.5 leading-snug">
                  <li>This card is the property of Malee House Survey & Mapping Services.</li>
                  <li>This card must be carried during office hours and field visits.</li>
                  <li>Loss of card should be reported immediately.</li>
               </ol>
            </div>
         </div>
         {/* Bottom Footer — absolutely pinned to sit centered in the blue stripe */}
         <div className="absolute bottom-0 left-0 right-0 h-[36px] flex items-center justify-center text-white text-[10.5px] font-bold tracking-[0.15em] uppercase">
            — WE BUILD TRUST WITH QUALITY & SERVICE —
         </div>
      </div>
   );

   React.useEffect(() => {
      const handleDownloadEvent = () => {
         // Create a synthetic event
         const e = { stopPropagation: () => {} } as any;
         handleDownload(e);
      };
      window.addEventListener("download-profile-id", handleDownloadEvent);
      return () => window.removeEventListener("download-profile-id", handleDownloadEvent);
   }, [profile]);

   return (
      <div className="flex flex-col items-center w-full">
         
         {/* Interactive Flip Card Frame */}
         <div 
            onClick={() => setIsFlipped(!isFlipped)} 
            className="w-[380px] h-[580px] cursor-pointer group [perspective:1000px] select-none transform origin-center scale-[0.85] md:scale-[0.9] -my-10"
            title="Click to flip card"
         >
            <div className={cn(
               "relative w-full h-full duration-700 [transform-style:preserve-3d]",
               isFlipped ? "[transform:rotateY(180deg)]" : ""
            )}>
                {/* Front Side */}
                <div 
                   className={cn(
                      "absolute inset-0 w-full h-full transition-opacity duration-300",
                      isFlipped ? "opacity-0 pointer-events-none" : "opacity-100"
                   )}
                   style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                >
                   <div className="w-full h-full bg-[#fdfdfd] rounded-[24px] shadow-2xl flex flex-col border border-gray-150/80 overflow-hidden">
                      <FrontCardContent />
                   </div>
                </div>
                
                {/* Back Side */}
                <div 
                   className={cn(
                      "absolute inset-0 w-full h-full [transform:rotateY(180deg)] transition-opacity duration-300",
                      isFlipped ? "opacity-100" : "opacity-0 pointer-events-none"
                   )}
                   style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                >
                   <div className="w-full h-full bg-[#fdfdfd] rounded-[24px] shadow-2xl flex flex-col border border-gray-150/80 overflow-hidden">
                      <BackCardContent />
                   </div>
                </div>
            </div>
         </div>

         {/* ── Bulletproof PDF Export References ── */}
         {/* Rendered flat side-by-side in hidden container to allow HTML2Canvas to capture without 3D rotation bugs */}
         <div className="absolute left-[-9999px] top-[-9999px] flex gap-5 pointer-events-none">
         <div className="p-[2px] bg-transparent">
               <div 
                  ref={frontCardRef} 
                  className="w-[380px] h-[580px] bg-[#fdfdfd] rounded-[24px] flex flex-col border border-gray-200 overflow-hidden"
               >
                  <FrontCardContent />
               </div>
            </div>
            <div className="p-[2px] bg-transparent">
               <div 
                  ref={backCardRef} 
                  className="w-[380px] h-[580px] bg-[#fdfdfd] rounded-[24px] flex flex-col border border-gray-200 overflow-hidden"
               >
                  <BackCardContent />
               </div>
            </div>
         </div>

      </div>
   );
}
