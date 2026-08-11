"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Lock, Mail, Sparkles, Loader2, Key } from "lucide-react";
import { motion } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    console.log("[Login] Session status checked:", status, "Session info:", session ? { email: session.user?.email, role: (session.user as any)?.role } : null);
    if (status === "authenticated") {
      console.log("[Login] Authenticated status confirmed, redirecting to /dashboard");
      router.replace("/dashboard");
    }
  }, [status, router, session]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin123@gmail.com",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    const loadingToast = toast.loading("Authenticating admin...");
    console.log("[Login] Executing credentials signIn for:", data.email.toLowerCase());

    try {
      const result = await signIn("credentials", {
        email: data.email.toLowerCase(),
        password: data.password,
        redirect: false,
      });

      console.log("[Login] signIn callback result:", result ? { ok: result.ok, status: result.status, error: result.error } : null);

      toast.dismiss(loadingToast);

      if (result?.error) {
        toast.error(result.error || "Invalid credentials");
      } else if (result?.ok) {
        toast.success("Successfully logged in! Welcome back.");
        
        if (typeof update === "function") {
          console.log("[Login] Forcing useSession update...");
          const updatedSession = await update();
          console.log("[Login] Session update completed:", updatedSession);
        } else {
          console.warn("[Login] useSession update function is unavailable");
        }

        console.log("[Login] Replacing route to /dashboard");
        router.replace("/dashboard");
      }
    } catch (err) {
      console.error("[Login] Unexpected sign-in error:", err);
      toast.dismiss(loadingToast);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#060814] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
          <p className="text-gray-400 text-sm font-medium">
            Loading session...
          </p>
        </div>
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="min-h-screen bg-[#060814] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
          <p className="text-gray-400 text-sm font-medium">
            Redirecting to dashboard...
          </p>
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
            {/* <Sparkles className="h-6 w-6" /> */}
            <img
              src="/investWithKaranveer.jpeg"
              alt="Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Invest with Karanveer
          </h2>
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
                {...register("email")}
                type="email"
                placeholder="admin123@gmai.com"
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 bg-[#080a14] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-50"
              />
            </div>
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">
                {errors.email.message}
              </p>
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
                {...register("password")}
                type="password"
                placeholder="••••••••"
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 bg-[#080a14] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-50"
              />
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">
                {errors.password.message}
              </p>
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

        <div className="mt-4 text-center text-sm text-gray-400">
          Don't have an account?{" "}
          {/* <Link
            href="/signup"
            className="text-blue-400 hover:text-blue-300 font-semibold"
          >
            Sign Up
          </Link> */}
          <Link
            href=""
            className="text-blue-400 hover:text-blue-300 font-semibold"
          >
            Sign Up
          </Link>
        </div>

        {/* Demo Credentials Alert Helper */}
        <div className="mt-6 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex gap-3 text-[11px] text-gray-400">
          <div className="p-1 rounded bg-blue-500/10 text-blue-400 self-start">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="font-semibold text-gray-300 block mb-0.5">
              Demo System Info
            </span>
            Seeded Admin:{" "}
            <span className="font-mono text-blue-400">admin123@gmail.com</span>
            <br />
            Password: <span className="font-mono text-blue-400">123456789</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
