"use client";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthIllustration } from "@/components/auth/AuthIllustration";
import { Building2 } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  return (
    <AuthLayout illustration={<AuthIllustration />}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <header className="flex items-center gap-4 mb-12 lg:mb-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-white bg-white text-indigo-600 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
            <Building2 className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Malee House
          </span>
        </header>

        <div className="flex flex-col w-full">
          <div className="mb-10 space-y-3">
            <h1 className="text-[42px] font-bold leading-[1.1] tracking-[-0.02em] text-slate-900">
              Welcome back.
            </h1>
            <p className="text-[17px] font-medium leading-[1.5] text-slate-500">
              Log in to coordinate your field operations and project workflows.
            </p>
          </div>

          <LoginForm />
        </div>
      </motion.div>
    </AuthLayout>
  );
}
