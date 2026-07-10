"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getAllUsersAction } from "@/actions/admin.actions";
import { Gift, Sparkles, Cake, Star, PartyPopper } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FloatingElement = ({ children, delay = 0, yOffset = 20, xOffset = 20, duration = 4 }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0.6, 1, 0.6], 
      scale: 1, 
      y: [0, -yOffset, 0],
      x: [0, xOffset, 0],
      rotate: [0, 10, -10, 0]
    }}
    transition={{ 
      duration, 
      delay, 
      repeat: Infinity, 
      ease: "easeInOut" 
    }}
    className="absolute pointer-events-none"
  >
    {children}
  </motion.div>
);

export function BirthdayNotifier() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasSeenBirthdays = sessionStorage.getItem("hasSeenBirthdays_v4");
    if (hasSeenBirthdays) return;

    async function checkBirthdays() {
      try {
        const { success, data } = await getAllUsersAction();
        if (success && data) {
          const today = new Date();
          const todayMonth = today.getMonth();
          const todayDate = today.getDate();

          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowMonth = tomorrow.getMonth();
          const tomorrowDate = tomorrow.getDate();

          const bdays: any[] = [];

          data.forEach((user: any) => {
            if (user.dob) {
              const dob = new Date(user.dob);
              if (!isNaN(dob.getTime())) {
                const dobMonth = dob.getMonth();
                const dobDate = dob.getDate();

                if (dobMonth === todayMonth && dobDate === todayDate) {
                  bdays.push({ user, type: 'today' });
                } else if (dobMonth === tomorrowMonth && dobDate === tomorrowDate) {
                  bdays.push({ user, type: 'tomorrow' });
                }
              }
            }
          });

          if (bdays.length > 0) {
            setNotifications(bdays);
          }
        }
      } catch (err) {
        console.error("Failed to check birthdays:", err);
      }
    }
    
    checkBirthdays();
  }, []);

  const handleAcknowledge = () => {
    sessionStorage.setItem("hasSeenBirthdays_v4", "true");
    setNotifications([]);
  };

  if (!mounted || notifications.length === 0) return null;

  const hasToday = notifications.some(n => n.type === 'today');
  
  const content = (
    <AnimatePresence>
      {notifications.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(16px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center p-4 bg-slate-900/60"
        >
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.8, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -40, transition: { duration: 0.3 } }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
            className="w-full max-w-[480px] relative perspective-1000"
          >
            {/* Ambient Glow */}
            <div className="absolute -inset-10 bg-gradient-to-r from-indigo-500 via-blue-500 to-violet-500 rounded-[3rem] blur-3xl opacity-30 animate-pulse-slow" />

            {/* Main Card */}
            <div className="bg-white/90 dark:bg-[#0c101b]/90 backdrop-blur-3xl border border-white/50 dark:border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col items-center">
              
              {/* Glass Highlights */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/40 to-transparent dark:from-white/5 pointer-events-none" />
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-blue-400 via-indigo-500 to-violet-500" />

              {/* Floating Decorations */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[2.5rem]">
                <FloatingElement delay={0} yOffset={30} xOffset={20} duration={4}><div className="absolute top-10 left-10"><Star className="w-6 h-6 text-indigo-400/60" fill="currentColor" /></div></FloatingElement>
                <FloatingElement delay={1} yOffset={-40} xOffset={-30} duration={5}><div className="absolute top-20 right-10"><PartyPopper className="w-8 h-8 text-blue-400/50" /></div></FloatingElement>
                <FloatingElement delay={0.5} yOffset={25} xOffset={15} duration={3.5}><div className="absolute bottom-32 left-8"><Gift className="w-7 h-7 text-violet-400/50" /></div></FloatingElement>
                <FloatingElement delay={1.5} yOffset={-20} xOffset={-10} duration={6}><div className="absolute bottom-20 right-12"><Star className="w-5 h-5 text-indigo-400/60" fill="currentColor" /></div></FloatingElement>
              </div>
              
              <div className="relative mb-8 mt-4">
                <div className="absolute inset-0 bg-indigo-500/30 animate-ping rounded-full blur-md" />
                <div className="bg-gradient-to-tr from-indigo-600 to-blue-400 p-6 rounded-full relative shadow-[0_0_40px_rgba(99,102,241,0.5)] border-2 border-white/20">
                  <Cake className="w-14 h-14 text-white" strokeWidth={1.5} />
                </div>
                <Sparkles className="absolute -top-3 -right-4 w-8 h-8 text-blue-300 animate-pulse drop-shadow-md" />
                <Sparkles className="absolute -bottom-2 -left-4 w-6 h-6 text-violet-300 animate-pulse delay-150 drop-shadow-md" />
              </div>

              <div className="text-center relative z-10 w-full">
                <h4 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 via-blue-500 to-violet-600 dark:from-indigo-300 dark:via-blue-300 dark:to-violet-300 tracking-tight mb-3">
                  {notifications.length > 1 ? "Celebrations!" : (hasToday ? "Happy Birthday! 🎂" : "Upcoming Birthday 🎈")}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 text-base">
                  {notifications.length > 1 
                    ? "We have multiple birthdays to celebrate!" 
                    : "Join us in wishing them a great day!"}
                </p>
                
                <div className="flex flex-col gap-4 w-full mb-10 max-h-[280px] overflow-y-auto scrollbar-none px-1">
                  {notifications.map((n, idx) => (
                    <motion.div 
                      key={n.user.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + (idx * 0.1) }}
                      className="group flex items-center gap-5 bg-white/50 dark:bg-white/[0.03] backdrop-blur-md p-4 rounded-3xl shadow-sm border border-white/60 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-full blur opacity-40 group-hover:opacity-70 transition-opacity" />
                        <img 
                          src={n.user.profile_photo || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80"}
                          alt={n.user.first_name}
                          className="relative w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-800 shrink-0 z-10"
                        />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="font-extrabold text-lg text-slate-900 dark:text-white truncate">
                          {n.user.first_name} {n.user.last_name}
                        </p>
                        <p className="text-sm font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-0.5">
                          {n.type === 'today' ? "Today" : "Tomorrow"}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAcknowledge}
                className="relative overflow-hidden px-8 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black tracking-[0.2em] uppercase rounded-2xl w-full shadow-2xl shadow-indigo-600/30 text-sm group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10">
                  Let's Celebrate!
                </span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
