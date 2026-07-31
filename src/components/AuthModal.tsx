import React, { useState, useEffect } from "react";
import { X, LogIn, UserPlus, LogOut, Mail, Lock, CheckCircle2, AlertCircle, Key, ShieldCheck, User as UserIcon, RefreshCw } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserChanged?: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onUserChanged }) => {
  const [mode, setMode] = useState<"login" | "signup" | "otp">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Derive username automatically from email
  const autoUsername = email.includes("@") ? email.split("@")[0] : email;

  useEffect(() => {
    const supabase = getSupabase();
    if (supabase) {
      // Check existing persistent session on load
      supabase.auth.getSession().then(({ data: { session } }) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (onUserChanged) onUserChanged(currentUser);
      });

      // Listen for auth state changes (keep user logged in)
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (onUserChanged) onUserChanged(currentUser);
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [onUserChanged]);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const supabase = getSupabase();
    if (!supabase) {
      setMessage({
        type: "error",
        text: "Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      });
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const derivedName = autoUsername || email;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: derivedName,
              display_name: derivedName,
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          setMessage({ type: "success", text: `Account created! Welcome, @${derivedName}!` });
        } else {
          // Move to OTP verification mode
          setMode("otp");
          setMessage({
            type: "success",
            text: `Sign up initiated! Enter the 6-digit OTP code sent to ${email} below.`,
          });
        }
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        setMessage({ type: "success", text: "Logged in successfully! Your session is saved." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Authentication failed." });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const supabase = getSupabase();
    if (!supabase) return;

    setLoading(true);

    try {
      // Try verifying with signup OTP type first, fallback to email OTP
      let { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode.trim(),
        type: "signup",
      });

      if (error) {
        // Retry with 'email' type if signup type failed
        const retryRes = await supabase.auth.verifyOtp({
          email,
          token: otpCode.trim(),
          type: "email",
        });
        data = retryRes.data;
        error = retryRes.error;
      }

      if (error) throw error;

      setUser(data.user);
      if (onUserChanged) onUserChanged(data.user);
      setMessage({ type: "success", text: "OTP verified! You are now signed in." });
      setMode("login");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Invalid OTP verification code." });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const supabase = getSupabase();
    if (!supabase || !email) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;
      setMessage({ type: "success", text: `A new OTP code has been sent to ${email}.` });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to resend OTP code." });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      setMessage({ type: "success", text: "Signed out successfully." });
    }
  };

  const displayName = user?.user_metadata?.username || user?.user_metadata?.display_name || (user?.email ? user.email.split("@")[0] : "User");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none">
      <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-zinc-100 font-bold text-base">
            <Key className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Supabase Auth & Login</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration notice if keys are missing */}
        {!isSupabaseConfigured && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start space-x-3 text-xs text-amber-900 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Supabase Credentials Needed:</span>
              <p className="mt-0.5 leading-relaxed text-[11px]">
                Please add <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and{" "}
                <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> to your environment variables or Secrets panel to activate live auth.
              </p>
            </div>
          </div>
        )}

        {/* Status Message */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-2xl border flex items-center space-x-2 text-xs ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Logged In View vs Form View */}
        {user ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-bold text-xl border-2 border-emerald-500 shadow-sm">
              {displayName ? displayName[0].toUpperCase() : "U"}
            </div>
            <div>
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Logged In (Session Saved)</span>
              </div>
              <div className="text-base font-bold text-slate-800 dark:text-zinc-100 mt-1">
                @{displayName}
              </div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {user.email}
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-colors shadow-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : mode === "otp" ? (
          /* OTP VERIFICATION FORM */
          <form onSubmit={handleVerifyOtp} className="py-4 space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-900 dark:text-emerald-200">
              <div className="font-bold flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verify OTP Code</span>
              </div>
              <p className="text-[11px] mt-1 text-emerald-700 dark:text-emerald-300">
                Enter the verification code sent to <strong>{email}</strong>.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-widest font-mono text-base bg-slate-50 dark:bg-zinc-800/80 border border-slate-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !otpCode.trim()}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? "Verifying..." : "Verify OTP & Complete Sign Up"}</span>
            </button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 font-semibold"
              >
                ← Back to Sign Up
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Resend OTP</span>
              </button>
            </div>
          </form>
        ) : (
          /* LOGIN & SIGNUP FORM */
          <form onSubmit={handleAuth} className="py-4 space-y-4 text-xs">
            {/* Toggle Mode */}
            <div className="flex bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl border border-slate-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-xl font-bold transition-all flex items-center justify-center space-x-1 ${
                  mode === "login"
                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs"
                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-xl font-bold transition-all flex items-center justify-center space-x-1 ${
                  mode === "signup"
                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs"
                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 dark:bg-zinc-800/80 border border-slate-300 dark:border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-hidden text-xs"
                />
              </div>
            </div>

            {/* Auto-derived Username display during Signup */}
            {mode === "signup" && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                  Auto-Generated Username
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    disabled
                    value={autoUsername ? `@${autoUsername}` : "@username"}
                    className="w-full bg-slate-100 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/60 rounded-xl pl-9 pr-3 py-2 text-slate-500 dark:text-zinc-400 font-medium text-xs cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
                  Formed automatically from your email prefix.
                </p>
              </div>
            )}

            {/* Password Field */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full bg-slate-50 dark:bg-zinc-800/80 border border-slate-300 dark:border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-hidden text-xs"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Processing...</span>
              ) : mode === "signup" ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account & Send OTP</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center text-[11px] text-slate-500 dark:text-zinc-500">
          <button
            onClick={() => {
              onClose();
              if ((window as any).openSqlModal) (window as any).openSqlModal();
            }}
            className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center space-x-1"
          >
            <Key className="w-3.5 h-3.5" />
            <span>View Full Supabase SQL</span>
          </button>
          <button
            onClick={onClose}
            className="hover:text-slate-800 dark:hover:text-zinc-300 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

