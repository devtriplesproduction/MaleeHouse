"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getTodayBirthdaysAction } from "@/actions/auth.actions";
import { Gift, Sparkles, Cake, Star, PartyPopper } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

const Balloons = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[99998] overflow-hidden">
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{
            opacity: 0,
            y: "110vh",
            x: `${Math.random() * 100}vw`,
          }}
          animate={{
            y: "-20vh",
            x: `calc(${Math.random() * 100}vw + ${Math.random() * 100 - 50}px)`,
            opacity: [0, 0.9, 0.9, 0],
          }}
          transition={{
            duration: Math.random() * 5 + 5,
            ease: "easeInOut",
            delay: Math.random() * 2,
            repeat: Infinity,
          }}
          className="absolute top-0 left-0"
        >
          <svg width="60" height="80" viewBox="0 0 24 32" fill="currentColor" className={
            ["text-rose-400/70", "text-blue-400/70", "text-emerald-400/70", "text-amber-400/70", "text-violet-400/70"][Math.floor(Math.random() * 5)]
          }>
            <path d="M12 0C7.58172 0 4 3.58172 4 8C4 13.5 10 20 12 24C14 20 20 13.5 20 8C20 3.58172 16.4183 0 12 0Z" />
            <path d="M11 24H13L14 28H10L11 24Z" fill="currentColor" />
            <path d="M12 28C12 28 10 32 12 32C14 32 12 28 12 28Z" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          </svg>
        </motion.div>
      ))}
    </div>
  );
};

const Confetti = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
      {Array.from({ length: 100 }).map((_, i) => {
        const isCircle = Math.random() > 0.5;
        const isRectangle = !isCircle && Math.random() > 0.5;
        const isTriangle = !isCircle && !isRectangle;
        
        return (
          <motion.div
            key={i}
            initial={{
              opacity: 1,
              y: "-10vh",
              x: `${Math.random() * 100}vw`,
              rotateX: 0,
              rotateY: 0,
              rotateZ: 0,
            }}
            animate={{
              y: "110vh",
              x: `calc(${Math.random() * 100}vw + ${Math.random() * 200 - 100}px)`,
              rotateX: Math.random() * 720,
              rotateY: Math.random() * 720,
              rotateZ: Math.random() * 720,
            }}
            transition={{
              duration: Math.random() * 4 + 3,
              ease: "linear",
              delay: Math.random() * 1.5,
              repeat: Infinity,
            }}
            className={cn(
              "absolute top-0 left-0",
              isRectangle ? "w-2 h-5" : "w-3 h-3",
              ["bg-rose-500", "bg-blue-500", "bg-emerald-500", "bg-amber-400", "bg-pink-500", "bg-violet-500", "bg-cyan-400"][
                Math.floor(Math.random() * 7)
              ]
            )}
            style={{
              borderRadius: isCircle ? '50%' : isRectangle ? '2px' : '0px',
              clipPath: isTriangle ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none'
            }}
          />
        );
      })}
    </div>
  );
};

export function BirthdayNotifier() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const { user: currentUser, role } = useUser();

  useEffect(() => {
    setMounted(true);
    if (!currentUser || !role) return;

    const hasSeenBirthdays = sessionStorage.getItem("hasSeenBirthdays_v10");
    if (hasSeenBirthdays) return;

    async function checkBirthdays() {
      try {
        const { success, data } = await getTodayBirthdaysAction();
        if (success && data && data.length > 0) {
          setNotifications(data);
        }
      } catch (err) {
        console.error("Failed to check birthdays:", err);
      }
    }
    
    checkBirthdays();
  }, [currentUser, role]);

  const handleAcknowledge = () => {
    sessionStorage.setItem("hasSeenBirthdays_v10", "true");
    setNotifications([]);
  };

  if (!mounted || notifications.length === 0 || !currentUser) return null;

  const myBirthday = notifications.find(n => n.type === 'today' && n.user.id === currentUser.id);
  const otherBirthdays = notifications.filter(n => n.user.id !== currentUser.id);
  
  let title = "";
  let subtitle = "";
  
  if (myBirthday) {
    title = "Happy Birthday! 🎂";
    subtitle = "Happy Birthday from the Malee House Team! It's your special day!";
  } else if (otherBirthdays.length > 1) {
    title = "Celebrations! 🎉";
    subtitle = "We have multiple birthdays to celebrate!";
  } else if (otherBirthdays.length === 1) {
    if (otherBirthdays[0].type === 'tomorrow') {
      title = "Upcoming Birthday 🎈";
      subtitle = "Plan something special for tomorrow!";
    } else {
      title = "Happy Birthday! 🎂";
      subtitle = "Wish them a fantastic day today!";
    }
  }

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
          {myBirthday && <Confetti />}
          
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.8, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -40, transition: { duration: 0.3 } }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
            className="w-full max-w-[480px] relative perspective-1000 z-10"
          >
            {/* Ambient Glow */}
            <div className="absolute -inset-10 bg-gradient-to-r from-indigo-500 via-blue-500 to-violet-500 rounded-[3rem] blur-3xl opacity-30 animate-pulse-slow" />

            {/* Main System Theme Card */}
            <div className="bg-white dark:bg-[#080b14] border border-slate-200 dark:border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col items-center">
              
              {/* Glass Highlights */}
              <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-blue-400 via-indigo-500 to-violet-500" />

              {/* Balloons if it's my birthday */}
              {myBirthday && <Balloons />}

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
                  {title}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 text-base">
                  {subtitle}
                </p>
                
                <div className="flex flex-col gap-4 w-full mb-10 max-h-[280px] overflow-y-auto scrollbar-none px-1">
                  {/* Show my birthday first if I'm celebrating */}
                  {myBirthday && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="group flex items-center gap-5 bg-indigo-50/50 dark:bg-white/[0.05] p-4 rounded-3xl shadow-sm border border-indigo-100 dark:border-white/10"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-full blur opacity-40 group-hover:opacity-70 transition-opacity" />
                        {myBirthday.user.profile_photo ? (
                          <img 
                            src={myBirthday.user.profile_photo}
                            alt={myBirthday.user.first_name}
                            className="relative w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-800 shrink-0 z-10"
                          />
                        ) : (
                          <div className="relative w-14 h-14 rounded-full border border-slate-200 dark:border-white/10 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg uppercase shrink-0 z-10">
                            {myBirthday.user.first_name?.[0] || ""}{myBirthday.user.last_name?.[0] || ""}
                          </div>
                        )}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="font-extrabold text-lg text-slate-900 dark:text-white truncate">
                          You!
                        </p>
                        <p className="text-sm font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-0.5">
                          Today
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {otherBirthdays.map((n, idx) => (
                    <motion.div 
                      key={n.user.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + (idx * 0.1) }}
                      className="group flex items-center gap-5 bg-white/50 dark:bg-white/[0.03] p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-full blur opacity-40 group-hover:opacity-70 transition-opacity" />
                        {n.user.profile_photo ? (
                          <img 
                            src={n.user.profile_photo}
                            alt={n.user.first_name}
                            className="relative w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-800 shrink-0 z-10"
                          />
                        ) : (
                          <div className="relative w-14 h-14 rounded-full border border-slate-200 dark:border-white/10 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg uppercase shrink-0 z-10">
                            {n.user.first_name?.[0] || ""}{n.user.last_name?.[0] || ""}
                          </div>
                        )}
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

              <Button 
                onClick={handleAcknowledge}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                {myBirthday ? "Thank You" : "Let's Celebrate!"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
