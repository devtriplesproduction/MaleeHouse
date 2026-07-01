'use client';

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectSchema, type CreateProjectInput } from '@/validations/project.schema';
import { createProjectAction } from '@/actions/project.actions';

export function ProjectWizard() {
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    reset,
    formState: { errors }
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      client_name: '',
      target_completion_date: '',
    },
    mode: 'onTouched'
  });

  const handleNext = async () => {
    let isStepValid = false;
    if (step === 1) {
      isStepValid = await trigger(['name', 'client_name']);
    }
    
    if (isStepValid) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const onSubmit = (data: CreateProjectInput) => {
    setSuccessMessage(null);
    setErrorMessage(null);
    
    startTransition(async () => {
      const result = await createProjectAction(data);
      if (result?.success) {
        reset();
        setStep(1);
        setSuccessMessage('Project initiated successfully!');
        // Ideally trigger a toast notification here
      } else {
        setErrorMessage(result?.error || 'An error occurred while creating the project.');
      }
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Liquid Glass Container */}
      <div className="backdrop-blur-xl bg-white/30 dark:bg-black/40 border border-white/40 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden relative transition-all duration-500 hover:shadow-indigo-500/10">
        {/* Subtle Gradient Glow Overlay */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 opacity-80" />
        <div className="absolute -inset-0.5 bg-gradient-to-br from-white/30 to-transparent opacity-50 pointer-events-none rounded-3xl" />
        
        <div className="p-8 md:p-12 relative z-10">
          <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-2 tracking-tight">
            New Project <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Initiation</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Step {step} of 2: {step === 1 ? 'Client Details' : 'Timeline & Scope'}
          </p>

          {successMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="flex items-center gap-3 font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {successMessage}
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="flex items-center gap-3 font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {errorMessage}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Basic Client Details */}
            <div className={`transition-all duration-500 ${step === 1 ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
              <div className="space-y-6">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400">
                    Project Name
                  </label>
                  <input 
                    {...register('name')}
                    placeholder="e.g. Skyline Tower Survey"
                    className="w-full px-4 py-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-400 backdrop-blur-sm shadow-sm"
                  />
                  {errors.name && <p className="mt-2 text-sm text-red-500 animate-in fade-in">{errors.name.message}</p>}
                </div>

                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400">
                    Client Name
                  </label>
                  <input 
                    {...register('client_name')}
                    placeholder="e.g. Acme Corp"
                    className="w-full px-4 py-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-400 backdrop-blur-sm shadow-sm"
                  />
                  {errors.client_name && <p className="mt-2 text-sm text-red-500 animate-in fade-in">{errors.client_name.message}</p>}
                </div>
              </div>
            </div>

            {/* Step 2: Timeline & Scope */}
            <div className={`transition-all duration-500 ${step === 2 ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
              <div className="space-y-6">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400">
                    Target Completion Date <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input 
                    type="date"
                    {...register('target_completion_date')}
                    className="w-full px-4 py-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300 text-gray-900 dark:text-white backdrop-blur-sm shadow-sm cursor-pointer"
                  />
                  {errors.target_completion_date && <p className="mt-2 text-sm text-red-500 animate-in fade-in">{errors.target_completion_date.message}</p>}
                </div>
              </div>
            </div>

            {/* Wizard Navigation */}
            <div className="flex justify-between items-center pt-8 mt-8 border-t border-gray-200/50 dark:border-gray-700/50">
              {/* Progress Indicators */}
              <div className="flex space-x-2">
                <div className={`h-1.5 w-10 rounded-full transition-all duration-500 ${step === 1 ? 'bg-indigo-600 shadow-sm shadow-indigo-500/50' : 'bg-gray-200 dark:bg-gray-700'}`} />
                <div className={`h-1.5 w-10 rounded-full transition-all duration-500 ${step === 2 ? 'bg-indigo-600 shadow-sm shadow-indigo-500/50' : 'bg-gray-200 dark:bg-gray-700'}`} />
              </div>

              <div className="flex gap-4">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isPending}
                    className="px-6 py-2.5 rounded-xl border border-gray-200/80 dark:border-gray-700/80 text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300 focus:ring-2 focus:ring-gray-200 font-medium disabled:opacity-50"
                  >
                    Back
                  </button>
                )}
                
                {step < 2 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-indigo-500/30 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 hover:-translate-y-0.5"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isPending}
                    className="relative px-8 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-indigo-500/30 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 flex items-center justify-center min-w-[140px]"
                  >
                    {isPending ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      'Initiate Project'
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
