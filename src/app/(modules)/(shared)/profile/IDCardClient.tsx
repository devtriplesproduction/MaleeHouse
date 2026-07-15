"use client";

import React, { useRef, useState } from "react";
import { Download, MapPin, Phone, Mail, Globe, Users, FileText, Home, User as UserIcon, Edit2, Check } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
      <div className="grid grid-cols-[90px_10px_1fr] gap-0 mb-2 items-center">
         <span className="font-bold text-gray-500 text-[10.5px] uppercase tracking-wide">{label}</span>
         <span className="font-bold text-gray-400 text-[10.5px]">:</span>
         {isEditing ? (
            <input
               value={editData[valueKey]}
               onChange={e => setEditData({ ...editData, [valueKey]: e.target.value })}
               className="text-[#102b4e] font-bold bg-white border border-gray-200 px-1 py-0 h-5 rounded text-[11px] w-full focus:outline-none focus:border-[#f16821]"
            />
         ) : (
            <span className="text-[#102b4e] font-bold text-[11px] truncate">{editData[valueKey]}</span>
         )}
      </div>
   );

   const renderEmergencyField = (label: string, valueKey: keyof typeof editData) => (
      <div className="grid grid-cols-[60px_10px_1fr] gap-0 text-[10px] ml-9 mb-0.5">
         <span className="font-semibold text-gray-600">{label}</span>
         <span className="font-semibold text-gray-400">:</span>
         {isEditing ? (
            <input
               value={editData[valueKey]}
               onChange={e => setEditData({ ...editData, [valueKey]: e.target.value })}
               className="text-[#102b4e] font-bold bg-white border border-gray-200 px-1 py-0 h-4 rounded w-[90%] focus:outline-none focus:border-[#f16821]"
            />
         ) : (
            <span className="text-[#102b4e] font-bold">{editData[valueKey]}</span>
         )}
      </div>
   );

   return (
      <div className="flex flex-col items-center w-full pb-10">
         <div className="w-full flex justify-end gap-3 mb-6 max-w-[720px]">
            {isEditing ? (
               <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm">
                  <Check className="w-3.5 h-3.5" /> Done Editing
               </button>
            ) : (
               <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm">
                  <Edit2 className="w-3.5 h-3.5" /> Edit Fields
               </button>
            )}

            <button onClick={handleDownload} disabled={isDownloading} className="px-4 py-1.5 bg-gradient-to-r from-[#102b4e] to-[#0a1b32] hover:opacity-90 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm">
               {isDownloading ? <span className="animate-spin text-lg border-2 border-white border-t-transparent rounded-full w-4 h-4"></span> : <Download className="w-4 h-4" />}
               Download PDF
            </button>
         </div>

         <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
            {/* Front Card */}
            <div ref={frontCardRef} className="w-[350px] h-[580px] bg-[#fdfdfd] rounded-[24px] shadow-2xl overflow-hidden relative flex flex-col border border-gray-100">
               {/* Top Header */}
               <div className="bg-gradient-to-br from-[#102b4e] to-[#0a1b32] pt-7 pb-9 px-4 flex flex-col items-center relative z-10 rounded-b-[40px] shadow-md border-b-[4px] border-[#f16821]">
                  <div className="flex items-center gap-3.5">
                     <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center">
                        <Home className="text-[#f16821] w-8 h-8" strokeWidth={2.5} />
                     </div>
                     <div className="flex flex-col">
                        <h2 className="text-white font-black text-[25px] leading-none tracking-wide">MALEE HOUSE</h2>
                        <p className="text-[#f16821] text-[9px] font-bold tracking-[0.18em] mt-1.5 uppercase">Survey & Mapping Services</p>
                     </div>
                  </div>
               </div>

               {/* Identity Card Badge */}
               <div className="flex justify-center -mt-3.5 z-20 relative">
                  <div className="bg-white text-[#102b4e] text-[10px] font-black tracking-widest px-6 py-1.5 rounded-full shadow-md border border-gray-100 uppercase">
                     Identity Card
                  </div>
               </div>

               {/* Body */}
               <div className="flex-1 px-5 py-6 flex flex-col justify-between relative">
                  {/* Background Watermark/Pattern */}
                  <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #102b4e 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>

                  <div className="flex flex-col gap-5 relative z-10 mt-1">
                     <div className="flex gap-4">
                        {/* Photo */}
                        <div className="w-[120px] h-[145px] p-1 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-gray-200 flex-shrink-0 flex items-center justify-center">
                           <div className="w-full h-full rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                              {profile.profile_photo ? (
                                 <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" />
                              ) : (
                                 <UserIcon className="w-12 h-12 text-gray-300" />
                              )}
                           </div>
                        </div>

                        {/* Top Details */}
                        <div className="flex flex-col justify-center text-[11px] w-full pr-1">
                           {isEditing ? (
                              <div className="grid grid-cols-[90px_10px_1fr] gap-0 mb-2 items-center">
                                 <span className="font-bold text-gray-500 text-[10.5px] uppercase tracking-wide">Name</span>
                                 <span className="font-bold text-gray-400 text-[10.5px]">:</span>
                                 <div className="flex flex-col gap-1">
                                    <input value={editData.firstName} onChange={e => setEditData({ ...editData, firstName: e.target.value })} className="text-[#102b4e] font-bold bg-white border border-gray-200 px-1 py-0 h-5 rounded text-[11px] w-full focus:outline-none focus:border-[#f16821]" />
                                    <input value={editData.lastName} onChange={e => setEditData({ ...editData, lastName: e.target.value })} className="text-[#102b4e] font-bold bg-white border border-gray-200 px-1 py-0 h-5 rounded text-[11px] w-full focus:outline-none focus:border-[#f16821]" />
                                 </div>
                              </div>
                           ) : (
                              <div className="grid grid-cols-[90px_10px_1fr] gap-0 mb-2 items-center">
                                 <span className="font-bold text-gray-500 text-[10.5px] uppercase tracking-wide">Name</span>
                                 <span className="font-bold text-gray-400 text-[10.5px]">:</span>
                                 <span className="text-[#102b4e] font-black text-[12px] leading-tight">{editData.firstName} {editData.lastName}</span>
                              </div>
                           )}
                           {renderField("Employee ID", "employeeId")}
                           {renderField("Designation", "designation")}
                           {renderField("Department", "department")}
                        </div>
                     </div>

                     {/* Bottom Details - spans full width below photo */}
                     <div className="flex flex-col bg-slate-50/50 rounded-xl p-3 border border-slate-100 shadow-sm">
                        {renderField("D.O.B.", "dob")}
                        {renderField("Blood Group", "bloodGroup")}
                        {renderField("Joined Date", "joiningDate")}
                        {renderField("Validity", "validity")}
                     </div>
                  </div>

                  {/* Signatures & Stamp */}
                  <div className="mt-auto flex justify-between items-end relative z-10 px-2 pb-1">
                     {/* Stamp */}
                     <div className="w-[70px] h-[70px] rounded-full border-[2px] border-[#102b4e]/80 flex items-center justify-center text-[#102b4e]/80 text-[6.5px] text-center font-black rotate-[-15deg] opacity-70 leading-tight">
                        MALEE HOUSE <br /> SATARA <br /> SURVEY & <br /> MAPPING
                     </div>

                     {/* Signature */}
                     <div className="flex flex-col items-center">
                        <div className="h-8 border-b-[1.5px] border-gray-400 w-28 mb-1.5 flex items-end justify-center">
                           <span className="font-serif text-[22px] text-gray-800 italic pr-2 -mb-1">Aulai</span>
                        </div>
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wide">Authorized Signatory</span>
                     </div>
                  </div>
               </div>

               {/* Footer */}
               <div className="bg-[#102b4e] text-white p-3.5 flex items-center gap-3.5 relative">

                  <div className="flex flex-col justify-center">
                     {/* <p className="text-[9.5px] leading-tight text-gray-300 font-medium tracking-wide">Empowering Precision,</p>
                     <p className="text-[9.5px] leading-tight mb-1 text-gray-300 font-medium tracking-wide">Delivering Excellence</p>
                     <p className="text-[11px] font-bold text-white tracking-widest mt-0.5">WWW.MALEEHOUSE.COM</p> */}
                  </div>
               </div>
            </div>

            {/* Back Card */}
            <div ref={backCardRef} className="w-[350px] h-[580px] bg-[#fdfdfd] rounded-[24px] shadow-2xl overflow-hidden relative flex flex-col border border-gray-100">
               {/* Top Header */}
               <div className="bg-gradient-to-br from-[#102b4e] to-[#0a1b32] pt-7 pb-8 px-4 flex flex-col items-center relative z-10 rounded-b-[30px] shadow-md border-b-[4px] border-[#f16821]">
                  <h2 className="text-white font-black text-3xl leading-none mb-2.5 mt-1 tracking-wide">MALEE HOUSE</h2>
                  <div className="flex items-center gap-3">
                     <div className="h-[1px] w-6 bg-white/40"></div>
                     <p className="text-[#f16821] text-[9px] font-bold tracking-[0.18em] uppercase">Survey & Mapping</p>
                     <div className="h-[1px] w-6 bg-white/40"></div>
                  </div>
               </div>

               {/* Body */}
               <div className="flex-1 px-5 py-4 flex flex-col gap-2.5 text-xs relative text-gray-800">
                  <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #102b4e 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>

                  {/* Contact Details */}
                  <div className="flex flex-col gap-2 relative z-10 mt-1">
                     <div className="flex gap-3.5 items-start">
                        <div className="text-white bg-[#f16821] p-1 rounded-full mt-0.5 shadow-sm"><MapPin className="w-3.5 h-3.5" /></div>
                        <div>
                           <p className="font-bold text-[#102b4e] text-[11px] mb-0.5 uppercase tracking-wide">Office Address</p>
                           <p className="text-[10px] text-gray-600 font-medium leading-relaxed pr-2">{companySettings.name}, {companySettings.address},<br />{companySettings.cityStateZip}</p>
                        </div>
                     </div>
                     <div className="flex gap-3.5 items-start">
                        <div className="text-white bg-[#f16821] p-1 rounded-full mt-0.5 shadow-sm"><Phone className="w-3.5 h-3.5" /></div>
                        <div className="w-full pr-4">
                           <p className="font-bold text-[#102b4e] text-[11px] mb-0.5 uppercase tracking-wide">Contact</p>
                           {isEditing ? (
                              <input
                                 value={editData.companyContact}
                                 onChange={e => setEditData({ ...editData, companyContact: e.target.value })}
                                 className="text-[10.5px] text-[#102b4e] font-bold bg-white border border-gray-200 px-1 py-0 h-5 rounded w-full focus:outline-none focus:border-[#f16821]"
                              />
                           ) : (
                              <p className="text-[10.5px] text-[#102b4e] font-bold">{editData.companyContact}</p>
                           )}
                        </div>
                     </div>
                     <div className="flex gap-3.5 items-start">
                        <div className="text-white bg-[#f16821] p-1 rounded-full mt-0.5 shadow-sm"><Mail className="w-3.5 h-3.5" /></div>
                        <div className="w-full pr-4">
                           <p className="font-bold text-[#102b4e] text-[11px] mb-0.5 uppercase tracking-wide">Email</p>
                           {isEditing ? (
                              <input
                                 value={editData.companyEmail}
                                 onChange={e => setEditData({ ...editData, companyEmail: e.target.value })}
                                 className="text-[10.5px] text-[#102b4e] font-bold bg-white border border-gray-200 px-1 py-0 h-5 rounded w-full focus:outline-none focus:border-[#f16821]"
                              />
                           ) : (
                              <p className="text-[10.5px] text-[#102b4e] font-bold">{editData.companyEmail}</p>
                           )}
                        </div>
                     </div>
                     <div className="flex gap-3.5 items-start">
                        <div className="text-white bg-[#f16821] p-1 rounded-full mt-0.5 shadow-sm"><Globe className="w-3.5 h-3.5" /></div>
                        <div>
                           <p className="font-bold text-[#102b4e] text-[11px] mb-0.5 uppercase tracking-wide">Website</p>
                           <p className="text-[10.5px] text-[#102b4e] font-bold">www.maleehouse.com</p>
                        </div>
                     </div>
                  </div>

                  <hr className="border-gray-200 my-0.5 relative z-10" />

                  {/* Emergency Contact */}
                  <div className="relative z-10 flex flex-col gap-0.5">
                     <div className="bg-gradient-to-r from-[#102b4e] to-[#1a3a63] text-white flex items-center gap-2 px-3 py-1 rounded-md w-max mb-0 shadow-sm">
                        <Users className="w-3 h-3" />
                        <span className="text-[8.5px] font-bold tracking-widest uppercase">Emergency Contact</span>
                     </div>
                     {renderEmergencyField("Name", "emergencyName")}
                     {renderEmergencyField("Relation", "emergencyRelation")}
                     {renderEmergencyField("Mobile No.", "emergencyMobile")}
                  </div>

                  {/* Terms & Conditions */}
                  <div className="relative z-10 mt-0 mb-0">
                     <div className="bg-gradient-to-r from-[#102b4e] to-[#1a3a63] text-white flex items-center gap-2 px-3 py-1 rounded-md w-max mb-0.5 shadow-sm">
                        <FileText className="w-3 h-3" />
                        <span className="text-[8.5px] font-bold tracking-widest uppercase">Terms & Conditions</span>
                     </div>
                     <ol className="list-decimal pl-5 pr-1 text-[8.5px] text-gray-600 font-medium space-y-0.5 leading-snug">
                        <li>This card is the property of Malee House Survey & Mapping Services.</li>
                        <li>This card must be carried during office hours and field visits.</li>
                        <li>Loss of card should be reported immediately.</li>
                        <li>Misuse of this card may result in disciplinary action.</li>
                     </ol>
                  </div>
               </div>

               {/* Footer */}
               <div className="bg-[#102b4e] text-white p-3.5 flex items-center gap-3.5 relative">

                  <div className="flex flex-col justify-center">

                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

