'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, User, Building2, Upload, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const signupSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  brandName: z.string().min(1, 'Page/Brand Name is required'),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
      brandName: '',
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Profile image must be less than 5MB');
        return;
      }
      setProfileImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: SignupFormValues) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name.trim());
      formData.append('email', data.email.toLowerCase().trim());
      formData.append('password', data.password);
      formData.append('brandName', data.brandName.trim());
      formData.append('role', 'admin');

      if (profileImageFile) {
        formData.append('profileImage', profileImageFile);
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.message || 'Unable to create account.');
        return;
      }

      toast.success(result.message || 'Account created successfully');
      setTimeout(() => router.push('/login'), 1200);
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
        className="w-full max-w-lg bg-[#0f1322]/80 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10 my-8"
      >
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400 mb-2">
            <Sparkles className="h-6 w-6 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Create your Private CRM Account</h2>
          <p className="text-gray-400 text-xs sm:text-sm">
            Set up your custom real estate workspace and private portfolio catalog.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Profile Image Upload */}
          <div className="flex flex-col items-center justify-center space-y-2 pb-2">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
              Profile Image
            </label>
            <div className="relative group cursor-pointer">
              <div className="h-20 w-20 rounded-full border-2 border-blue-500/40 bg-[#080a14] overflow-hidden flex items-center justify-center shadow-inner">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-gray-500" />
                )}
              </div>
              <label
                htmlFor="profile-image-input"
                className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-white text-xs font-medium"
              >
                <Upload className="h-4 w-4" />
              </label>
              <input
                id="profile-image-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={loading}
                className="hidden"
              />
            </div>
            <p className="text-[11px] text-gray-400">Click to upload custom profile picture</p>
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-500" />
              <input
                {...register('name')}
                type="text"
                placeholder="e.g. Karanveer Singh"
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 bg-[#080a14] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-50"
              />
            </div>
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Page / Brand Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
              Page / Brand Name
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-500" />
              <input
                {...register('brandName')}
                type="text"
                placeholder="e.g. Invest With Karanveer / Jaipur Property Hub / Urban Property"
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 bg-[#080a14] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-50"
              />
            </div>
            {errors.brandName && <p className="text-red-400 text-xs mt-1">{errors.brandName.message}</p>}
          </div>

          {/* Email Address */}
          <div className="space-y-1">
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

          {/* Password */}
          <div className="space-y-1">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-500/35 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
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
