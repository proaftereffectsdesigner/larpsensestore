"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, ArrowLeft, X, Eye, EyeOff } from "lucide-react";
import MiniPumpkin from "@/components/halloween/MiniPumpkin";
import { HALLOWEEN_EVENT_ENABLED } from "@/components/halloween/HalloweenConfig";

export default function AuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationJwt, setVerificationJwt] = useState("");
  
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "verify">("login");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setMode("login");
      setEmail("");
      setPassword("");
      setErrorMsg("");
      setSuccessMsg("");
      setShowPassword(false);
      setVerificationCode("");
      setVerificationJwt("");
    };
    window.addEventListener("open-auth", handleOpen);
    return () => window.removeEventListener("open-auth", handleOpen);
  }, []);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (mode === "signup") {
        if (!password || password.length < 6) {
          setErrorMsg("Password must be at least 6 characters long.");
          setLoading(false);
          return;
        }

        const res = await fetch('/api/auth/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Failed to send verification code');
        
        setVerificationJwt(data.token);
        setSuccessMsg("Verification code sent to your email!");
        setMode("verify");
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setIsOpen(false);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationJwt, code: verificationCode, password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Verification failed');

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      
      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reset email");
      
      setSuccessMsg("Password reset email sent! Check your inbox.");
      setMode("login");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const switchMode = (newMode: "login" | "signup" | "forgot" | "verify") => {
    setErrorMsg("");
    setSuccessMsg("");
    setMode(newMode);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90">
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
      
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[24px] shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header - Aligned with store style and LarpSense branding */}
        <div className="p-6 md:p-8 pb-5 flex items-center justify-between border-b border-white/5 relative z-20">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="LarpSense" className="h-6 w-auto object-contain" />
            <div className="h-4 w-px bg-white/10" />
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>
                {mode === "login" && "Sign In"}
                {mode === "signup" && "Create Account"}
                {mode === "verify" && "Verify Email"}
                {mode === "forgot" && "Reset Password"}
              </span>
              {HALLOWEEN_EVENT_ENABLED && <MiniPumpkin className="w-4 h-4 -mt-0.5" />}
            </h3>
          </div>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 relative z-20">
          <p className="text-[13px] text-gray-400 mb-6 font-normal">
            {mode === "login" ? "Enter your details to access your account." : 
             mode === "signup" ? "Create an account to start purchasing accounts." : 
             mode === "verify" ? "Enter the 6-digit code sent to your email." :
             "Enter your email and we'll send you a password reset link."}
          </p>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3.5 py-2.5 rounded-xl mb-5 text-left">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3.5 py-2.5 rounded-xl mb-5 text-left">
              {successMsg}
            </div>
          )}

          {mode === "forgot" ? (
            <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-500" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-semibold py-3.5 px-4 rounded-full hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 mt-2 text-sm shadow-none"
              >
                {loading ? "Processing..." : <>Send Reset Link <ArrowRight className="w-4 h-4" /></>}
              </button>
              
              <div className="mt-6 text-center">
                <button 
                  type="button" 
                  onClick={() => switchMode("login")} 
                  className="text-gray-400 hover:text-white text-xs transition-colors font-medium inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
                </button>
              </div>
            </form>
          ) : mode === "verify" ? (
            <form onSubmit={handleVerifyCode} className="space-y-4" noValidate>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="block w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white text-center tracking-[0.4em] text-xl placeholder-gray-600 focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full bg-white text-black font-semibold py-3.5 px-4 rounded-full hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 mt-2 text-sm disabled:opacity-50 shadow-none"
              >
                {loading ? "Verifying..." : <>Verify & Create Account <ArrowRight className="w-4 h-4" /></>}
              </button>
              
              <div className="mt-6 text-center">
                <button 
                  type="button" 
                  onClick={() => switchMode("signup")} 
                  className="text-gray-400 hover:text-white text-xs transition-colors font-medium inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to sign up
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4" noValidate>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-500" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                  {mode === "login" && (
                    <button 
                      type="button" 
                      onClick={() => switchMode("forgot")}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-500" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 bg-[#111] border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-semibold py-3.5 px-4 rounded-full hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 mt-2 text-sm shadow-none"
              >
                {loading ? "Processing..." : <>{mode === "login" ? "Sign In" : "Sign Up"} <ArrowRight className="w-4 h-4" /></>}
              </button>

              {mode === "login" && (
                <>
                  <div className="relative flex py-3 items-center">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-500 text-[11px] uppercase tracking-widest font-medium">or continue with</span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    className="w-full bg-[#111] border border-white/10 text-white font-medium py-3 px-4 rounded-full hover:bg-white/5 transition-colors flex items-center justify-center gap-3 text-sm"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                </>
              )}

              <div className="mt-6 text-center text-gray-400 text-xs">
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button 
                  type="button" 
                  onClick={() => switchMode(mode === "login" ? "signup" : "login")} 
                  className="text-white hover:underline font-semibold ml-1"
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
