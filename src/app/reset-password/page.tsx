"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, KeyRound, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import ParticlesBackground from "@/components/ParticlesBackground";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Invalid Link</h2>
        <p className="text-gray-400 mb-8">This password reset link is invalid or missing.</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent font-semibold rounded-xl px-6 py-3 hover:bg-accent/20 transition-colors">
          Return to Home
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/confirm-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Password Reset Successful</h2>
        <p className="text-gray-400 mb-8">Your password has been updated securely. Redirecting you to the home page...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
          <KeyRound className="w-8 h-8 text-white/80" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Create New Password</h2>
        <p className="text-gray-400 text-sm">Enter your new password below. Make sure it is secure.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm text-center">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
            placeholder="••••••••"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
            placeholder="••••••••"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-accent hover:bg-accent-hover text-black font-bold rounded-xl px-6 py-4 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden py-20 px-4">
      <ParticlesBackground />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[#141414]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">
          <Suspense fallback={<div className="text-center text-gray-400">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
