'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Settings, 
  Building, 
  Phone, 
  Mail, 
  MessageSquare, 
  MapPin, 
  Palette, 
  Loader2, 
  Check, 
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '@/components/ThemeProvider';

const settingsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  officeAddress: z.string().min(1, 'Office address is required'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  whatsApp: z.string().min(10, 'WhatsApp must be at least 10 digits'),
  email: z.string().email('Please enter a valid email address'),
  theme: z.enum(['light', 'dark']).default('dark')
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting, errors }
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema) as any,
    defaultValues: {
      companyName: 'Apex Real Estate Solutions',
      officeAddress: '123 Business Park, Tonk Road, Jaipur',
      phone: '+919876543210',
      whatsApp: '+919876543210',
      email: 'contact@apexrealestate.com',
      theme: 'dark'
    }
  });

  const selectedTheme = watch('theme');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        reset({
          companyName: data.companyName,
          officeAddress: data.officeAddress,
          phone: data.phone,
          whatsApp: data.whatsApp,
          email: data.email,
          theme: data.theme || 'dark'
        });
      } else {
        toast.error('Failed to load branding configurations');
      }
    } catch (err) {
      toast.error('Error fetching settings');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        toast.success('Branding preferences saved successfully');
        // Apply theme context change
        setTheme(data.theme);
      } else {
        toast.error('Failed to save settings');
      }
    } catch (err) {
      toast.error('Error updating system configurations');
    }
  };

  const handleSelectThemeCard = (mode: 'light' | 'dark') => {
    setValue('theme', mode, { shouldValidate: true });
    // Instant review click feedback
    setTheme(mode);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
        <span className="text-sm text-[var(--muted)]">Configuring preferences workspace...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          System Preferences & Branding <Settings className="h-4.5 w-4.5 text-blue-500" />
        </h2>
        <p className="text-xs text-[var(--muted)] mt-0.5">
          Configure office locations, email signatures, support lines, and default workspace themes.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Card: Branding configurations */}
        <div className="md:col-span-8 p-6 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] pb-2 border-b border-[var(--border)]">
            Corporate Branding details
          </h3>

          <div className="space-y-4">
            
            {/* Company Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--muted)] uppercase flex items-center gap-1">
                <Building className="h-3.5 w-3.5" /> Company Name
              </label>
              <input
                {...register('companyName')}
                type="text"
                className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
              />
              {errors.companyName && <p className="text-red-400 text-[10px]">{errors.companyName.message}</p>}
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--muted)] uppercase flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> Support Email
              </label>
              <input
                {...register('email')}
                type="email"
                className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
              />
              {errors.email && <p className="text-red-400 text-[10px]">{errors.email.message}</p>}
            </div>

            {/* Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted)] uppercase flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> Corporate Mobile
                </label>
                <input
                  {...register('phone')}
                  type="text"
                  className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                />
                {errors.phone && <p className="text-red-400 text-[10px]">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted)] uppercase flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5 text-green-500" /> WhatsApp Hotline
                </label>
                <input
                  {...register('whatsApp')}
                  type="text"
                  className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                />
                {errors.whatsApp && <p className="text-red-400 text-[10px]">{errors.whatsApp.message}</p>}
              </div>
            </div>

            {/* Office Address */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--muted)] uppercase flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Corporate Headquarters
              </label>
              <textarea
                {...register('officeAddress')}
                rows={3}
                className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
              />
              {errors.officeAddress && <p className="text-red-400 text-[10px]">{errors.officeAddress.message}</p>}
            </div>

          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow disabled:opacity-50"
            >
              {isSubmitting ? 'Saving settings...' : 'Save Preferences'}
            </button>
          </div>
        </div>

        {/* Right Card: Theme configuration selectors */}
        <div className="md:col-span-4 p-6 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm space-y-4 h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] pb-2 border-b border-[var(--border)] flex items-center gap-1">
            <Palette className="h-4 w-4" /> Default Workspace theme
          </h3>

          <div className="space-y-3">
            {/* Light Mode Card */}
            <div
              onClick={() => handleSelectThemeCard('light')}
              className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200 hover:border-blue-500 ${
                selectedTheme === 'light'
                  ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/10'
                  : 'border-[var(--border)] bg-[var(--background)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-amber-500/10 text-amber-500">
                  <Sun className="h-4.5 w-4.5" />
                </div>
                <span className="text-xs font-bold">Standard Light</span>
              </div>
              {selectedTheme === 'light' && (
                <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>

            {/* Dark Mode Card */}
            <div
              onClick={() => handleSelectThemeCard('dark')}
              className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200 hover:border-blue-500 ${
                selectedTheme === 'dark'
                  ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/10'
                  : 'border-[var(--border)] bg-[var(--background)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-blue-500/10 text-blue-500">
                  <Moon className="h-4.5 w-4.5" />
                </div>
                <span className="text-xs font-bold">Sleek Obsidian</span>
              </div>
              {selectedTheme === 'dark' && (
                <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-[10px] text-[var(--muted)] flex gap-2">
            <Sparkles className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <span>
              Obsidian Dark theme applies optimized color styling for screens during low light usage.
            </span>
          </div>

        </div>

      </form>

    </div>
  );
}
