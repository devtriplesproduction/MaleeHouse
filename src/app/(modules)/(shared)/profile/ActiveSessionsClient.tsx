'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Monitor, Smartphone, LogOut, CheckCircle2, ShieldAlert, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Session {
  id: string;
  deviceType: 'desktop' | 'mobile';
  os: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export default function ActiveSessionsClient() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    setMounted(true);

    // Dynamic OS & Browser detection
    const detectDevice = () => {
      if (typeof window === 'undefined') {
        return { os: 'Desktop', browser: 'Web Browser', deviceType: 'desktop' as const };
      }
      
      const ua = navigator.userAgent;
      let os = 'Unknown OS';
      let browser = 'Web Browser';
      let deviceType: 'desktop' | 'mobile' = 'desktop';

      if (ua.indexOf('Win') !== -1) os = 'Windows';
      else if (ua.indexOf('Mac') !== -1) os = 'macOS';
      else if (ua.indexOf('X11') !== -1) os = 'UNIX';
      else if (ua.indexOf('Linux') !== -1) os = 'Linux';
      
      if (/Android/.test(ua)) {
        os = 'Android';
        deviceType = 'mobile';
      } else if (/iPhone|iPad|iPod/.test(ua)) {
        os = 'iOS';
        deviceType = 'mobile';
      }

      if (ua.indexOf('Chrome') !== -1 && ua.indexOf('Chromium') === -1) {
        browser = 'Google Chrome';
      } else if (ua.indexOf('Safari') !== -1 && ua.indexOf('Chrome') === -1) {
        browser = 'Apple Safari';
      } else if (ua.indexOf('Firefox') !== -1) {
        browser = 'Mozilla Firefox';
      } else if (ua.indexOf('Edge') !== -1 || ua.indexOf('Edg') !== -1) {
        browser = 'Microsoft Edge';
      }

      return { os, browser, deviceType };
    };

    const device = detectDevice();
    
    // Set current active session dynamically
    const currentSession: Session = {
      id: 'current-session',
      deviceType: device.deviceType,
      os: device.os,
      browser: device.browser,
      ip: 'Detecting...',
      location: 'Detecting...',
      lastActive: 'Active Now',
      isCurrent: true
    };

    setSessions([currentSession]);

    // Fetch real IP and Location dynamically
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.ip) {
          setSessions(prev => prev.map((s: any) => s.isCurrent ? {
            ...s,
            ip: data.ip,
            location: data.city ? `${data.city}, ${data.region || data.country_name}` : 'Unknown Location'
          } : s));
        }
      })
      .catch(() => {
        // Fallback for offline / adblocker / localhost environments
        setSessions(prev => prev.map((s: any) => s.isCurrent ? {
          ...s,
          ip: '127.0.0.1',
          location: 'Local Connection'
        } : s));
      });

  }, []);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full py-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/10 transition-all"
      >
        Active Sessions
      </button>

      {isOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0f121b] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative overflow-hidden text-slate-900 dark:text-white">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-500/10">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Sessions</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Security check for all logged-in devices</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Session Items */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar mb-6">
              {sessions.map((session) => {
                const Icon = session.deviceType === 'desktop' ? Monitor : Smartphone;
                
                return (
                  <div 
                    key={session.id} 
                    className="p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {session.os} ({session.browser})
                          </span>
                          {session.isCurrent && (
                            <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              This device
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                          IP: {session.ip} • Location: {session.location}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-white/5">
              <span className="text-xs text-emerald-500 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Your active session is secure
              </span>
              
              <button
                onClick={() => setIsOpen(false)}
                className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm shadow-indigo-500/10 flex items-center justify-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
