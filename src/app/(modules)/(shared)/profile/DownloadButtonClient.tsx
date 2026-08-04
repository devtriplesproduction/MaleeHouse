"use client";

import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DownloadButtonClient() {
   const [isDownloading, setIsDownloading] = useState(false);

   useEffect(() => {
      const handlePdfFinished = () => {
         setIsDownloading(false);
      };
      window.addEventListener("pdf-download-finished", handlePdfFinished);
      return () => window.removeEventListener("pdf-download-finished", handlePdfFinished);
   }, []);

   const triggerDownload = () => {
      setIsDownloading(true);
      window.dispatchEvent(new CustomEvent("download-profile-id"));
      setTimeout(() => setIsDownloading(false), 3000);
   };

   return (
      <Button 
         onClick={triggerDownload} 
         disabled={isDownloading} 
         variant="hr"
         className="flex items-center gap-2 text-xs font-bold tracking-wider h-10 px-4 whitespace-nowrap"
      >
         {isDownloading ? (
            <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-3.5 h-3.5" />
         ) : (
            <Download className="w-4 h-4" />
         )}
         Download ID Card
      </Button>
   );
}
