'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.string().min(1, 'Please select a role').refine(
    (value) => ['admin', 'sales', 'manager'].includes(value),
    {
      message: 'Please select a valid role',
    }
  ),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: '',
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.toLowerCase().trim(),
          password: data.password,
          role: data.role,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.message || 'Unable to create account.');
        return;
      }

      toast.success(result.message || 'Account created successfully');
      setTimeout(() => router.push('/login'), 1400);
    } catch (error) {
      toast.error('Unable to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#060814] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#0f1322]/80 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10"
      >
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400 mb-2">
            <User className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Create your CRM account</h2>
          <p className="text-gray-400 text-sm">
            Start managing your portfolio with a secure CRM account.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-500" />
              <input
                {...register('name')}
                type="text"
                placeholder="Your full name"
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 bg-[#080a14] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-50"
              />
            </div>
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-500" />
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 bg-[#080a14] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-50"
              />
            </div>
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-500" />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 8 characters"
                disabled={loading}
                className="w-full pl-10 pr-10 py-2.5 bg-[#080a14] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-200 transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Role</label>
            <div className="relative">
              <select
                {...register('role')}
                disabled={loading}
                className="w-full appearance-none pl-4 pr-10 py-2.5 bg-[#080a14] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-50"
              >
                <option value="" hidden>
                  Select role
                </option>
                <option value="admin">admin</option>
                <option value="sales">sales</option>
                <option value="manager">manager</option>
              </select>
            </div>
            {errors.role && <p className="text-red-400 text-xs mt-1">{errors.role.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-500/35 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
            Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
