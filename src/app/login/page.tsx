'use client';

import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Lock, Mail, Sparkles, Loader2, Key } from 'lucide-react';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@crm.com',
      password: '',
    }
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    const loadingToast = toast.loading('Authenticating admin...');
    
    try {
      const result = await signIn('credentials', {
        email: data.email.toLowerCase(),
        password: data.password,
        redirect: false,
      });

      toast.dismiss(loadingToast);

      if (result?.error) {
        toast.error(result.error || 'Invalid credentials');
      } else {
        toast.success('Successfully logged in! Welcome back.');
        router.replace('/dashboard');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen bg-[#060814] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
          <p className="text-gray-400 text-sm font-medium">Restoring admin session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#060814] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Dynamic Background Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#0f1322]/80 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10 pulse-glow"
      >
        {/* Brand/Heading */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400 mb-2">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Apex Real Estate</h2>
          <p className="text-gray-400 text-xs sm:text-sm">
            Enter admin credentials to access your CRM catalog.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-500" />
              <input
                {...register('email')}
                type="email"
                placeholder="admin@crm.com"
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 bg-[#080a14] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-50"
              />
            </div>
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                Security Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-500" />
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 bg-[#080a14] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-50"
              />
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-500/35 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                Signing in...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 text-white" />
                Authenticate Session
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Alert Helper */}
        <div className="mt-6 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex gap-3 text-[11px] text-gray-400">
          <div className="p-1 rounded bg-blue-500/10 text-blue-400 self-start">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="font-semibold text-gray-300 block mb-0.5">Demo System Info</span>
            Seeded Admin: <span className="font-mono text-blue-400">admin@crm.com</span><br/>
            Password: <span className="font-mono text-blue-400">admin123</span>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
