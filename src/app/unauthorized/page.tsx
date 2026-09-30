"use client";

import React, { useState } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { signOutAction } from '@/actions/auth.actions';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleReturnToLogin = async () => {
    setIsLoggingOut(true);
    await signOutAction();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full glass-card p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-500 text-sm">
            You do not have the required role permissions to access this page. Please contact your system administrator if you believe this is a mistake.
          </p>
        </div>
        <button 
          onClick={handleReturnToLogin}
          disabled={isLoggingOut}
          className="inline-flex items-center justify-center w-full h-10 px-4 gap-2 font-medium tracking-wide text-white transition duration-200 bg-indigo-600 rounded-lg hover:bg-indigo-500 focus:shadow-outline focus:outline-none disabled:opacity-70"
        >
          {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isLoggingOut ? "Logging out..." : "Return to Login"}
        </button>
      </div>
    </div>
  );
}
