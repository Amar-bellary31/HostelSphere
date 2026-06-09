"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Activity, ShieldCheck, Lock, User as UserIcon } from "lucide-react";

export default function LoginPage() {
  const { login, loading: authLoading } = useAuth();
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await login(username, password);
      if (result.success) {
        toast.success("Welcome back! Redirecting to dashboard...");
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("An error occurred during login. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="flex items-center gap-3 animate-pulse">
          <Activity className="w-8 h-8 text-indigo-400 animate-spin" />
          <span className="text-xl font-bold tracking-tight text-slate-100">
            HostelSphere...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4 shadow-lg shadow-indigo-500/5">
            <Activity className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            HostelSphere ERP
          </h1>
          <p className="text-sm text-slate-400">
            Hostel Management & Student Allocation System
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-semibold text-slate-100">
              Administrator Access
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4.5 h-4.5" />
                </div>
                <input
                  type="text"
                  id="username"
                  required
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <input
                  type="password"
                  id="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-indigo-600/10 active:scale-[0.98]"
            >
              {submitting ? "Signing in..." : "Authenticate Session"}
            </button>
          </form>
        </div>

        {/* Demo Helper Callout */}
        <div className="mt-6 p-4 rounded-2xl bg-indigo-950/20 border border-indigo-900/30 text-center">
          <p className="text-xs text-indigo-300">
            🔒 Seeded Demo Credentials: Use username <span className="font-mono font-bold text-white bg-indigo-500/20 px-1.5 py-0.5 rounded">admin</span> and password <span className="font-mono font-bold text-white bg-indigo-500/20 px-1.5 py-0.5 rounded">admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
