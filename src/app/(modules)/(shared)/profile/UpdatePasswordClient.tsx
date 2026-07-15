'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { changePasswordAction } from '@/actions/auth.actions';
import { Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';

export default function UpdatePasswordClient({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    setLoading(true);
    setError('');

    const res = await changePasswordAction(userId, password);
    setLoading(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setPassword('');
        setConfirm('');
      }, 2000);
    } else {
      setError(res.error || 'Failed to update password.');
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-indigo-500/5"
      >
        Update Password
      </button>

      {isOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Update Password</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Secure your operational access</p>
              </div>
            </div>

            {success ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm font-medium text-center border border-emerald-100 dark:border-emerald-500/20">
                Password updated successfully!
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-rose-500 font-medium">{error}</p>
                )}

                <div className="flex items-center gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
