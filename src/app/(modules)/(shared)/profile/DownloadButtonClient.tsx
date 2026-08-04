"use client";

import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";

export default function DownloadButtonClient() {
   const [isDownloading, setIsDownloading] = useState(false);

   useEffect(() => {
      // Listen for window state changes when downloading starts or finishes if needed, 
      // but simple trigger is fine. Let's just track locally for basic UI state.
      const handlePdfFinished = () => {
         setIsDownloading(false);
      };
      window.addEventListener("pdf-download-finished", handlePdfFinished);
      return () => window.removeEventListener("pdf-download-finished", handlePdfFinished);
   }, []);

   const triggerDownload = () => {
      setIsDownloading(true);
      window.dispatchEvent(new CustomEvent("download-profile-id"));
      // Safe fallback timeout to clear spinner if download fails silently
      setTimeout(() => setIsDownloading(false), 3000);
   };

   return (
      <button 
         onClick={triggerDownload} 
         disabled={isDownloading} 
         className="px-4 py-2 bg-gradient-to-r from-[#0c2e5c] to-[#0b1b33] hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm whitespace-nowrap"
      >
         {isDownloading ? (
            <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-3.5 h-3.5" />
         ) : (
            <Download className="w-3.5 h-3.5" />
         )}
         Download ID Card
      </button>
   );
}
