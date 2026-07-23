"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { Mail, Lock, User as UserIcon, ArrowRight, ArrowLeft, X, Eye, EyeOff } from "lucide-react";

export default function AuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
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
      // Manual email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setErrorMsg("Please enter a valid email address.");
        setLoading(false);
        return;
      }

      if (mode === "signup") {
        // Zabezpieczenie przed zakładaniem nowych kont po IP (Ban Evasion)
        const ipCheckRes = await fetch('/api/check-ip');
        const ipCheckData = await ipCheckRes.json();
        
        if (ipCheckData.banned) {
          setErrorMsg("You have been banned. No access allowed.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data.session) {
          // Jeśli potwierdzanie maila jest wyłączone w Supabase, użytkownik od razu jest zalogowany
          setIsOpen(false);
          router.refresh();
        } else {
          setSuccessMsg("Check your email for a confirmation link!");
          setMode("login");
        }
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg("Password reset email sent! Check your inbox.");
      setMode("login");
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const switchMode = (newMode: "login" | "signup" | "forgot") => {
    setErrorMsg("");
    setSuccessMsg("");
    setMode(newMode);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={() => setIsOpen(false)}></div>
      <div className="w-full max-w-md bg-[#141414] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-colors z-20"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="absolute -top-32 -right-32 w-64 h-64 bg-accent/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
            {mode === "forgot" ? <Lock className="w-6 h-6 text-accent" /> : <UserIcon className="w-6 h-6 text-accent" />}
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {mode === "login" ? "Welcome back" : mode === "signup" ? "Create an account" : "Reset your password"}
          </h1>
          <p className="text-gray-400 text-sm mb-4">
            {mode === "login" ? "Enter your details to access your account." : 
             mode === "signup" ? "Sign up to start purchasing accounts." : 
             "Enter your email and we'll send you a reset link."}
          </p>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4 text-left">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-3 rounded-xl mb-4 text-left">
              {successMsg}
            </div>
          )}
        </div>

        {mode === "forgot" ? (
          <form onSubmit={handleResetPassword} className="space-y-4 relative z-10" noValidate>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? "Processing..." : <>Send Reset Link <ArrowRight className="w-4 h-4" /></>}
            </button>
            
            <div className="mt-6 text-center">
              <button 
                type="button" 
                onClick={() => switchMode("login")} 
                className="text-gray-400 hover:text-white text-sm transition-colors font-medium flex items-center justify-center gap-2 w-full"
              >
                <ArrowLeft className="w-4 h-4" /> Back to login
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAuth} className="space-y-4 relative z-10" noValidate>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                {mode === "login" && (
                  <button 
                    type="button" 
                    onClick={() => switchMode("forgot")}
                    className="text-xs text-accent hover:text-white transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? "Processing..." : <>{mode === "login" ? "Sign In" : "Sign Up"} <ArrowRight className="w-4 h-4" /></>}
            </button>

            {mode === "login" && (
              <>
                <div className="relative flex py-4 items-center">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase tracking-widest">or continue with</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  className="w-full bg-[#1c1c1c] border border-white/10 text-white font-medium py-3 px-4 rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center gap-3"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google
                </button>
              </>
            )}

            <div className="mt-6 text-center text-gray-400 text-sm">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button" 
                onClick={() => switchMode(mode === "login" ? "signup" : "login")} 
                className="text-white hover:underline font-medium"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
