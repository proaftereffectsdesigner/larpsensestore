"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";
import ParticlesBackground from "@/components/ParticlesBackground";
import { User } from "@supabase/supabase-js";
import { Copy, Search, RefreshCw, Lock, Package, KeyRound, Wallet, Plus, Eye, EyeOff, TrendingUp, Gamepad, ShoppingBag, User as UserIcon, LayoutGrid, Shield, Mail, Upload, X, Crop, Trash2, Crown, ShieldCheck, MessageSquare, Award, Gem, Zap, ExternalLink, ArrowRight, ChevronLeft, ChevronRight, Smartphone, Monitor, UserPlus, CalendarCheck, Medal, Coins, ShieldAlert, Star } from "lucide-react";
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';
import { products } from "@/lib/products";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

function DashboardContent() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'orders';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [discordUsername, setDiscordUsername] = useState<string | null>(null);
  const [isBanned, setIsBanned] = useState(false);
  const [bannedAt, setBannedAt] = useState<string | null>(null);
  const [banReason, setBanReason] = useState<string | null>(null);
  const [banType, setBanType] = useState<string | null>(null);
  const [banExpiresAt, setBanExpiresAt] = useState<string | null>(null);
  const [banAcknowledged, setBanAcknowledged] = useState(true);
  const [canUpdateProfile, setCanUpdateProfile] = useState(true);
  const [canTopup, setCanTopup] = useState(true);
  const [canPurchase, setCanPurchase] = useState(true);

  useEffect(() => {
    if (searchParams.get('tab')) {
      setActiveTab(searchParams.get('tab')!);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.history.pushState(null, '', `?tab=${tab}`);
  };

  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [emailUpdating, setEmailUpdating] = useState(false);
  const [profileUpdating, setProfileUpdating] = useState(false);
  const saveVersionRef = useRef(0);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [revealedIdx, setRevealedIdx] = useState<{orderId: string, idx: number} | null>(null);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ticketsPage, setTicketsPage] = useState(1);
  const [myReviewsPage, setMyReviewsPage] = useState(1);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'completed' | 'pending' | 'cancelled' | 'failed' | 'refunded'>('all');

  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarBlobToUpload, setAvatarBlobToUpload] = useState<Blob | null>(null);
  const [profileMessage, setProfileMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [avatarError, setAvatarError] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loginActivity, setLoginActivity] = useState<any[]>([]);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [loggingOutDevices, setLoggingOutDevices] = useState(false);
  const [securityTab, setSecurityTab] = useState<'overview' | 'sessions' | 'history'>('overview');
  
  const [imgSrc, setImgSrc] = useState("");
  const [savedImgSrc, setSavedImgSrc] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState(false);

  // Review System State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const router = useRouter();

  const fetchOrders = async (userId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, reviews(id)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const now = new Date();
      const processedData = data.map(order => {
        if (order.status === 'pending') {
          const orderTime = new Date(order.created_at);
          const diffMinutes = (now.getTime() - orderTime.getTime()) / 1000 / 60;
          if (diffMinutes >= 60) {
            supabase.from('orders').update({status: 'cancelled'}).eq('id', order.id).then();
            return { ...order, status: 'cancelled' };
          }
        }
        return order;
      });
      setOrders(processedData);
    }
  };

  const fetchTickets = async (userId: string) => {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTickets(data);
    }
  };

  const fetchMyReviews = async (userId: string) => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMyReviews(data);
    }
  };

  const fetchLoginActivity = async (userId: string) => {
    const { data, error } = await supabase
      .from("login_activity")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
      
    if (!error && data) {
      setLoginActivity(data);
    }
  };

  const fetchBalance = async (sessionUser: User) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", sessionUser.id)
      .single();
    if (data) {
      setProfile(data);
      setNewName(data.display_name || sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || "");
      setNewAvatar(data.avatar_url || sessionUser.user_metadata?.avatar_url || "");
      setNewBio(data.bio || "");
      setBalance(Number(data.balance));
      setDiscordUsername(data.discord_username);
      setIsBanned(data.is_banned);
      setBannedAt(data.banned_at);
      setBanReason(data.ban_reason);
      setBanType(data.ban_type);
      setBanExpiresAt(data.ban_expires_at);
      setBanAcknowledged(data.ban_acknowledged !== false); // default true for existing profiles
      setCanUpdateProfile(data.can_update_profile !== false);
      setCanTopup(data.can_topup !== false);
      setCanPurchase(data.can_purchase !== false);
      setIsPrivate(data.is_private || false);
      setRecoveryEmail(data.recovery_email || "");
    }
  };

  const handleViewTranscript = async (url: string) => {
    try {
      const res = await fetch(`/api/tickets/transcript?url=${encodeURIComponent(url)}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch transcript");
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      toast.error("Could not load transcript.");
    }
  };

  const handleAcknowledgeBan = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetch("/api/user/acknowledge-ban", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`
          }
        });
        setBanAcknowledged(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const hasLoggedSessionRef = useRef(false);

  const loadDashboardData = async (sessionUser: User) => {
    await Promise.all([fetchOrders(sessionUser.id), fetchBalance(sessionUser)]);
    
    // Log the session asynchronously in the background, then fetch activity so it shows immediately
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        try {
          if (!hasLoggedSessionRef.current) {
            hasLoggedSessionRef.current = true;
            const res = await fetch("/api/auth/log-session", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${session.access_token}`
              }
            });
            if (res.status === 401) {
              await supabase.auth.signOut();
              window.location.href = "/";
              return;
            }
            if (res.ok) {
              const data = await res.json().catch(() => ({}));
              if (data.ip) sessionStorage.setItem('my_ip', data.ip);
              if (data.userAgent) sessionStorage.setItem('my_user_agent', data.userAgent);
            }
          }
        } catch (e) {
          console.error(e);
        }
        fetchBalance(session.user);
        fetchOrders(session.user.id);
        fetchTickets(session.user.id);
        fetchMyReviews(session.user.id);
        fetchLoginActivity(session.user.id);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        window.location.href = "/";
      } else {
        setSessionToken(session.access_token);
        setUser(session.user);
        loadDashboardData(session.user);
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    });

    const checkSession = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          window.location.href = "/";
          return;
        }
        setSessionToken(session.access_token);
        setUser(session.user);
        loadDashboardData(session.user);
      });
    };

    checkSession();
    window.addEventListener('focus', checkSession);
    window.addEventListener('pageshow', checkSession);

    const handleBalanceUpdate = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) fetchBalance(session.user);
      });
    };
    window.addEventListener('balance-updated', handleBalanceUpdate);

    return () => {
      window.removeEventListener('balance-updated', handleBalanceUpdate);
      window.removeEventListener('focus', checkSession);
      window.removeEventListener('pageshow', checkSession);
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (isBadgesModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isBadgesModalOpen]);

  useEffect(() => {
    const confirmRecoveryAndEmail = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const recoveryToken = urlParams.get('confirmRecoveryToken');
      const emailToken = urlParams.get('confirmEmailToken');
      const deleteToken = urlParams.get('confirmDeleteToken');
      
      if (recoveryToken) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch('/api/auth/confirm-recovery-change', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
            body: JSON.stringify({ confirmToken: recoveryToken })
          });
          const data = await res.json();
          if (res.ok) {
            toast.success("Recovery email successfully updated!");
            if (data.newEmail) setRecoveryEmail(data.newEmail);
          } else {
            toast.error(data.error || "Failed to confirm recovery email.");
          }
        } catch (e: any) {
          toast.error("Error confirming recovery email.");
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (emailToken) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch('/api/auth/confirm-email-change', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
            body: JSON.stringify({ confirmToken: emailToken })
          });
          const data = await res.json();
          if (res.ok) {
            toast.success("Email address successfully changed! Please log in again.");
            
            // Force log out everyone including this device
            const myDeviceId = sessionStorage.getItem('device_id');
            await supabase.channel('online_users').send({
              type: 'broadcast',
              event: 'force_logout',
              payload: { scope: 'others', userId: user?.id || session?.user?.id, exceptDeviceId: null }
            });
            await supabase.auth.signOut();
            window.location.href = "/";
            return;
          } else {
            toast.error(data.error || "Failed to confirm email change.");
          }
        } catch (e: any) {
          toast.error("Error confirming email change.");
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (deleteToken) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch('/api/user/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
            body: JSON.stringify({ confirmDeleteToken: deleteToken })
          });
          const data = await res.json();
          if (res.ok) {
            toast.success("Account successfully deleted.");
            await supabase.auth.signOut();
            window.location.href = "/";
            return;
          } else {
            toast.error(data.error || "Failed to confirm account deletion.");
          }
        } catch (e: any) {
          toast.error("Error confirming account deletion.");
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    confirmRecoveryAndEmail();
  }, [user]);

  const handlePasswordResetRequest = async () => {
    if (!user?.email) return;
    setPasswordUpdating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ email: user.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reset email");
      toast.success("Password reset email sent via Resend! Check your inbox.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || newEmail === user?.email) return;
    setEmailUpdating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ newEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send update email");
      toast.success("Email update confirmation sent via Resend!");
      setNewEmail("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setEmailUpdating(false);
    }
  };

  const handleUpdateRecoveryEmail = async () => {
    if (!user || !recoveryEmail) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/auth/request-recovery-change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ newRecoveryEmail: recoveryEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send update email");
      toast.success("Confirmation sent to your original email address!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleLogoutAllOtherDevices = async () => {
    if (!user) return;
    setLoggingOutDevices(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) throw error;
      
      // Visually log out other devices by inserting 'logout' records for them
      const map = new Map();
      loginActivity.forEach(log => {
        const key = `${log.user_agent}-${log.ip_address}`;
        if (!map.has(key)) map.set(key, log);
      });
      const active = Array.from(map.values()).filter(log => log.action !== 'logout');
      
      // All except index 0 (which is current)
      const others = active.slice(1);
      for (const s of others) {
         await supabase.from('login_activity').insert({
            user_id: user.id,
            ip_address: s.ip_address,
            location: s.location,
            user_agent: s.user_agent,
            action: 'logout'
         });
      }
      
      // Broadcast force logout to other tabs
      const myDeviceId = sessionStorage.getItem('device_id');
      await supabase.channel('online_users').send({
        type: 'broadcast',
        event: 'force_logout',
        payload: { scope: 'others', userId: user.id, exceptDeviceId: myDeviceId }
      });
      
      await fetchLoginActivity(user.id);
      toast.success("Successfully logged out from all other devices!");
    } catch (err: any) {
      toast.error("Failed to log out from other devices: " + err.message);
    } finally {
      setLoggingOutDevices(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm.");
      return;
    }
    setDeletingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/auth/request-delete", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session?.access_token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request account deletion");
      
      toast.success("Confirmation email sent! Please check your inbox to complete the deletion.");
      setDeleteConfirmText("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (isBanned || !canUpdateProfile) {
      setProfileMessage({ type: 'error', text: "Your account is restricted from updating profile information." });
      return;
    }

    setProfileUpdating(true);
    setProfileMessage(null);
    const currentVersion = ++saveVersionRef.current;
    let finalAvatarUrl = newAvatar;
    
    try {
        if (avatarBlobToUpload) {
            if (user?.user_metadata?.avatar_url && user.user_metadata.avatar_url.includes('avatars/')) {
                const oldFileName = user.user_metadata.avatar_url.split('/').pop()?.split('?')[0];
                if (oldFileName && oldFileName.startsWith(user.id)) {
                    await supabase.storage.from('avatars').remove([oldFileName]);
                }
            }
            
            const fileExt = "jpg";
            const fileName = `${user?.id}-avatar.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarBlobToUpload, { upsert: true });
            if (uploadError) throw new Error(uploadError.message);
            
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
            finalAvatarUrl = publicUrl + "?v=" + Date.now();
        } else if (newAvatar === "") {
            if (user?.user_metadata?.avatar_url && user.user_metadata.avatar_url.includes('avatars/')) {
                const oldFileName = user.user_metadata.avatar_url.split('/').pop()?.split('?')[0];
                if (oldFileName && oldFileName.startsWith(user.id)) {
                    await supabase.storage.from('avatars').remove([oldFileName]);
                }
            }
        }

        const { data, error } = await supabase.auth.updateUser({
            data: { full_name: newName, avatar_url: finalAvatarUrl || null, bio: newBio || null }
        });

        if (error) throw new Error(error.message);
        
        if (user) {
            const { error: profileError } = await supabase.from("profiles").update({
                display_name: newName,
                avatar_url: finalAvatarUrl || null,
                bio: newBio || null,
                is_private: isPrivate
            }).eq("id", user.id);
            if (profileError) throw new Error(profileError.message);
        }
        
        if (data.user && saveVersionRef.current === currentVersion) {
            setUser(data.user);
            if (profile) {
                setProfile({ ...profile, display_name: newName, avatar_url: finalAvatarUrl || null, bio: newBio || null, is_private: isPrivate });
            }
            setAvatarBlobToUpload(null);
            setProfileMessage({ type: 'success', text: "Profile updated successfully!" });
            window.dispatchEvent(new Event('balance-updated'));
            setTimeout(() => setProfileMessage(null), 5000);
        }
    } catch (err: any) {
        if (err.message?.includes("User from sub claim") || err.message?.includes("JWT") || err.status === 401) {
            await supabase.auth.signOut();
            window.location.href = "/";
            return;
        }
        setProfileMessage({ type: 'error', text: "Error updating profile: " + err.message });
    }
    setProfileUpdating(false);
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError("");
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setAvatarError("File is too large! Maximum size is 2MB.");
        return;
      }
      if (file.type === "image/gif") {
        setAvatarError("Animated GIFs are not allowed.");
        return;
      }
      
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(file);
      setIsCropping(true);
      // Reset input value to allow selecting same file again
      e.target.value = '';
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleRemoveAvatar = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setNewAvatar("");
    setAvatarBlobToUpload(null);
    setSavedImgSrc("");
    setImgSrc("");
    
    if (user) {
        const { data } = await supabase.auth.updateUser({ data: { avatar_url: "" } });
        if (data.user) setUser(data.user);
    }
  };

  const handleAvatarCropAndUpload = async () => {
    if (!croppedAreaPixels) return;
    setAvatarError("");
    try {
      const croppedImageBlob = await getCroppedImg(imgSrc, croppedAreaPixels, 0);
      if (!croppedImageBlob) throw new Error("Could not crop image");

      setAvatarBlobToUpload(croppedImageBlob);
      const localUrl = URL.createObjectURL(croppedImageBlob);
      setNewAvatar(localUrl);
      setSavedImgSrc(imgSrc);
      setIsCropping(false);
      // We keep imgSrc so the user can re-crop the original image if they want before saving
    } catch (e) {
      console.error(e);
      setAvatarError("Error cropping image");
    }
  };



  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleSubmitReview = async () => {
    if (!reviewOrder) return;
    setSubmittingReview(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          orderId: reviewOrder.id,
          rating: reviewRating,
          comment: reviewComment
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review");
      
      toast.success("Review submitted successfully! Thank you.");
      
      // Update local state to mark this order as reviewed
      setOrders(prev => prev.map(o => 
        o.id === reviewOrder.id 
          ? { ...o, reviews: { id: 'new-review' } } 
          : o
      ));
      
      setReviewModalOpen(false);
      setReviewOrder(null);
      setReviewComment("");
      setReviewRating(5);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  const completedOrders = orders.filter((o: any) => o.status === 'completed');
  const totalSpent = completedOrders.reduce((acc: any, order: any) => acc + Number(order.total_price), 0);
  const totalOrders = completedOrders.length;
  const isGoogleLogin = user?.app_metadata?.provider === 'google' || user?.app_metadata?.providers?.includes('google');

  const accountAgeDays = Math.floor((new Date().getTime() - new Date(user.created_at || new Date()).getTime()) / (1000 * 3600 * 24));
  const joinDate = new Date(user.created_at || new Date()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  
  const ALL_TIME_BADGES = [
    { name: "Newcomer / Registered", desc: "Welcome to the community", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", glow: "shadow-[0_0_2px_rgba(59,130,246,0.2)]", Icon: UserPlus, daysReq: 0 },
    { name: "Active Member", desc: "Active community member for a week", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", glow: "shadow-[0_0_5px_rgba(16,185,129,0.3)]", Icon: CalendarCheck, daysReq: 7 },
    { name: "Trusted User", desc: "30 days of trusted membership", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", glow: "shadow-[0_0_8px_rgba(168,85,247,0.4)]", Icon: ShieldCheck, daysReq: 30 },
    { name: "Established Client", desc: "90 days of consistent presence", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", glow: "shadow-[0_0_12px_rgba(249,115,22,0.5)]", Icon: Award, daysReq: 90 },
    { name: "Platform Veteran", desc: "Legendary 6 months milestone", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", glow: "shadow-[0_0_16px_rgba(239,68,68,0.6)]", Icon: Medal, daysReq: 180 },
    { name: "Foundation Pillar", desc: "Full year of elite platform status", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", glow: "shadow-[0_0_22px_rgba(234,179,8,0.8)]", Icon: Crown, daysReq: 365 },
  ];
  
  let TimeIcon = UserPlus;
  let timeBadge = ALL_TIME_BADGES[0];
  if (accountAgeDays >= 365) { timeBadge = ALL_TIME_BADGES[5]; TimeIcon = Crown; }
  else if (accountAgeDays >= 180) { timeBadge = ALL_TIME_BADGES[4]; TimeIcon = Medal; }
  else if (accountAgeDays >= 90) { timeBadge = ALL_TIME_BADGES[3]; TimeIcon = Award; }
  else if (accountAgeDays >= 30) { timeBadge = ALL_TIME_BADGES[2]; TimeIcon = ShieldCheck; }
  else if (accountAgeDays >= 7) { timeBadge = ALL_TIME_BADGES[1]; TimeIcon = CalendarCheck; }

  let BuyerIcon = ShoppingBag;
  let buyerBadge = { name: "Verified Buyer", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", glow: "shadow-[0_0_8px_rgba(34,197,94,0.3)]" };
  
  if (totalSpent >= 250) {
    buyerBadge = { name: "VIP Status", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30", glow: "shadow-[0_0_15px_rgba(34,211,238,0.5)]" };
    BuyerIcon = Gem;
  } else if (totalSpent >= 50) {
    buyerBadge = { name: "Premium Tier", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", glow: "shadow-[0_0_15px_rgba(234,179,8,0.5)]" };
    BuyerIcon = Coins;
  }

  return (
    <>
      <ParticlesBackground />
      {/* Cropper Modal */}
      {isCropping && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#141414] border border-white/10 rounded-3xl overflow-hidden w-full max-w-2xl max-h-[90vh] shadow-2xl relative flex flex-col">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#0a0a0a] shrink-0">
              <h3 className="font-bold text-white text-lg">Crop Avatar</h3>
              <button onClick={() => { setIsCropping(false); setImgSrc(savedImgSrc); }} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="relative w-full flex-1 min-h-[400px] bg-black">
              <Cropper
                image={imgSrc}
                crop={crop}
                zoom={zoom}
                maxZoom={5}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="p-6 bg-[#0a0a0a] space-y-4 shrink-0">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 block">Zoom</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={5}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => {
                    setZoom(Number(e.target.value))
                  }}
                  className="w-full accent-accent bg-white/5 h-2 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <button 
                onClick={handleAvatarCropAndUpload}
                disabled={avatarUploading}
                className="w-full bg-white text-black font-bold rounded-xl px-6 py-3.5 hover:bg-gray-200 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.15)]"
              >
                {avatarUploading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : "Crop & Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && reviewOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#141414] border border-white/10 rounded-3xl overflow-hidden w-full max-w-md shadow-2xl relative flex flex-col">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#0a0a0a]">
              <h3 className="font-bold text-white text-lg">Leave a Review</h3>
              <button onClick={() => setReviewModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-gray-400 mb-2">Order: <span className="text-white font-mono">{reviewOrder.id.split('-')[0]}</span></p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className={`transition-all hover:scale-110 ${reviewRating >= star ? 'text-yellow-400' : 'text-gray-600'}`}
                    >
                      <svg className="w-8 h-8 drop-shadow-md" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase">Comment (Optional)</label>
                  <span className="text-[10px] text-gray-500 font-mono">{reviewComment.length}/400</span>
                </div>
                <textarea 
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  maxLength={400}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-gray-300 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all resize-none"
                  placeholder="Tell us what you think..."
                />
              </div>
              <button 
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="w-full bg-accent text-white font-bold rounded-xl px-6 py-3.5 hover:bg-accent/80 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-6 mt-8 w-full min-h-screen relative z-10">
        {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-accent/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Premium Header */}
      <div className="flex items-center gap-6 mb-12 relative">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-accent to-purple-500 p-[2px] shadow-2xl shadow-accent/20">
          <div className="w-full h-full bg-[#0a0a0a] rounded-[22px] flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
            ) : (
              <span className="text-3xl font-bold text-white uppercase">{user?.email?.[0] || 'U'}</span>
            )}
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight mb-2">
            Overview
          </h1>
          <p className="text-gray-400 font-medium">Welcome back, <span className="text-gray-200">{profile?.display_name || user.email?.split('@')[0]}</span></p>
        </div>
      </div>

      {isBanned ? (
        <div className="mb-8 animate-in slide-in-from-top-4">
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-4 shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/30">
              <ShieldAlert className="w-6 h-6 text-red-500" />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-black uppercase tracking-tight text-white mb-1">Your account has been suspended.</h2>
              <p className="text-red-400 font-medium">Banned on {bannedAt ? new Date(bannedAt).toLocaleString() : 'Unknown date'} {banExpiresAt ? `until ${new Date(banExpiresAt).toLocaleString()}` : '(Permanent)'}</p>
              <p className="text-sm text-gray-400 mt-2">You can no longer make purchases, add balance, or change your profile settings. You can only view your past orders.</p>
            </div>
          </div>
        </div>
      ) : (!canUpdateProfile || !canTopup || !canPurchase) ? (
        <div className="mb-8 animate-in slide-in-from-top-4">
          <div className="bg-orange-500/10 border border-orange-500/20 text-orange-500 p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-[0_0_30px_rgba(249,115,22,0.1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 border border-orange-500/30">
              <ShieldAlert className="w-6 h-6 text-orange-500" />
            </div>
            <div className="text-left w-full">
              <h2 className="text-xl font-black uppercase tracking-tight text-white mb-2">Account Restricted</h2>
              <p className="text-sm text-orange-400/80 mb-3 font-medium">Your account has specific features disabled by an administrator.</p>
              <ul className="flex flex-col sm:flex-row flex-wrap gap-2">
                {!canPurchase && <li className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 rounded-lg text-xs font-bold text-orange-400 uppercase tracking-widest"><Package className="w-3.5 h-3.5" /> Purchases Blocked</li>}
                {!canTopup && <li className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 rounded-lg text-xs font-bold text-orange-400 uppercase tracking-widest"><Wallet className="w-3.5 h-3.5" /> Top-ups Blocked</li>}
                {!canUpdateProfile && <li className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 rounded-lg text-xs font-bold text-orange-400 uppercase tracking-widest"><UserIcon className="w-3.5 h-3.5" /> Profile Locked</li>}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col md:flex-row gap-10">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-2">
          <button onClick={() => handleTabChange('profile')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all ${activeTab === 'profile' ? 'bg-white/10 text-white font-bold shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 font-medium'}`}>
            <UserIcon className={`w-5 h-5 ${activeTab === 'profile' ? 'text-accent' : ''}`} /> Profile Settings
          </button>
          <button onClick={() => handleTabChange('orders')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all ${activeTab === 'orders' ? 'bg-white/10 text-white font-bold shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 font-medium'}`}>
            <LayoutGrid className={`w-5 h-5 ${activeTab === 'orders' ? 'text-accent' : ''}`} /> My Orders
          </button>
          <button onClick={() => handleTabChange('security')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all ${activeTab === 'security' ? 'bg-white/10 text-white font-bold shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 font-medium'}`}>
            <Shield className={`w-5 h-5 ${activeTab === 'security' ? 'text-accent' : ''}`} /> Security
          </button>
          <button onClick={() => handleTabChange('tickets')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all ${activeTab === 'tickets' ? 'bg-white/10 text-white font-bold shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 font-medium'}`}>
            <MessageSquare className={`w-5 h-5 ${activeTab === 'tickets' ? 'text-accent' : ''}`} /> Support Tickets
          </button>
          <button onClick={() => handleTabChange('reviews')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all ${activeTab === 'reviews' ? 'bg-white/10 text-white font-bold shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 font-medium'}`}>
            <Star className={`w-5 h-5 ${activeTab === 'reviews' ? 'text-accent' : ''}`} /> Reviews
          </button>
        </div>

        {/* Main Content Layout */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#141414] border border-white/10 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-gray-300" />
                  </div>
                  Community Profile
                </h2>
                <Link href={`/user/${user?.id}`} className="flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                  View Public Profile <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="bg-[#141414] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative max-w-4xl">
                {/* Banner Area */}
                <div className="h-48 w-full bg-gradient-to-r from-[#0a0a0a] via-accent/20 to-[#0a0a0a] relative border-b border-white/5">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                </div>

                {/* Profile Body */}
                <div className="px-6 md:px-10 pb-10 relative">
                  <div className="flex flex-col md:flex-row gap-8">
                    
                    {/* Left Column: Avatar & Badges */}
                    <div className="flex flex-col items-center -mt-24 z-10 shrink-0 w-full md:w-48 space-y-6">
                      
                      {/* Avatar Editor */}
                      <div className="w-48">
                        {newAvatar ? (
                          <div className="relative w-48 h-48 group rounded-full overflow-hidden border-4 border-[#141414] shadow-2xl bg-[#0a0a0a]">
                            <img src={newAvatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                            
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4">
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  setImgSrc(savedImgSrc || newAvatar);
                                  setIsCropping(true);
                                }}
                                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex flex-col items-center justify-center transition-all hover:scale-110 shadow-xl"
                                title="Edit Avatar"
                              >
                                <Crop className="w-5 h-5 text-white" />
                              </button>

                              <button 
                                onClick={handleRemoveAvatar}
                                className="w-12 h-12 rounded-full bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 flex flex-col items-center justify-center transition-all hover:scale-110 shadow-xl"
                                title="Remove Avatar"
                              >
                                <Trash2 className="w-5 h-5 text-red-400 hover:text-red-300" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center w-48 h-48 bg-[#0a0a0a] hover:bg-white/5 border-4 border-[#141414] text-white font-semibold rounded-full cursor-pointer transition-colors shadow-2xl relative overflow-hidden group">
                            {avatarUploading ? (
                              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-white transition-colors">
                                <Upload className="w-6 h-6" />
                                <span className="text-sm">Upload</span>
                              </div>
                            )}
                            <input 
                              type="file" 
                              accept="image/png, image/jpeg, image/jpg" 
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={onSelectFile}
                            />
                          </label>
                        )}
                        {avatarError && <p className="text-xs text-red-400 mt-2 font-semibold text-center">{avatarError}</p>}
                      </div>

                      {/* Rank */}
                      <div className="w-full bg-[#0a0a0a] rounded-xl p-2 border border-accent/20 shadow-[0_0_10px_rgba(34,197,94,0.1)] flex items-center justify-center gap-1.5">
                        {totalSpent > 50 ? (
                          <><Crown className="w-3.5 h-3.5 text-accent" /><span className="text-xs font-bold text-accent uppercase tracking-widest">Elite Buyer</span></>
                        ) : (
                          <><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /><span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Verified Member</span></>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="w-full bg-[#0a0a0a] rounded-2xl p-4 border border-white/5 space-y-3">
                        <h3 
                          className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors"
                          onClick={() => setIsBadgesModalOpen(true)}
                          title="Click to view all badges"
                        >
                          Badges
                        </h3>
                        <div className="flex flex-wrap justify-center gap-2">
                          {/* Time Badge (Dynamic) */}
                          <div className={`p-2 rounded-xl transition-all border group relative ${timeBadge.bg} ${timeBadge.glow} hover:scale-110`}>
                            <TimeIcon className={`w-5 h-5 ${timeBadge.color}`} />
                            <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-black border border-white/10 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all z-50 flex flex-col items-center shadow-xl">
                              <span className={`font-bold text-xs ${timeBadge.color}`}>{timeBadge.name}</span>
                              <span className="text-[10px] text-gray-400 mt-0.5">Member since {joinDate}</span>
                            </div>
                          </div>

                          {/* Buyer Badge (Dynamic) */}
                          {totalOrders > 0 && (
                            <div className={`p-2 rounded-xl transition-all border group relative ${buyerBadge.bg} ${buyerBadge.glow} hover:scale-110`}>
                              <BuyerIcon className={`w-5 h-5 ${buyerBadge.color}`} />
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black border border-white/10 px-3 py-1 text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-xl font-bold ${buyerBadge.color} flex flex-col items-center">
                                <span className={buyerBadge.color}>{buyerBadge.name}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Linked Accounts */}
                      <div className="w-full bg-[#0a0a0a] rounded-2xl p-4 border border-white/5 space-y-3">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Connections</h3>
                        {discordUsername ? (
                          <div className="w-full flex items-center justify-between gap-2 bg-[#5865F2]/5 border border-[#5865F2]/20 rounded-xl px-3 py-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <svg className="w-4 h-4 text-[#5865F2] shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" /></svg>
                              <span className="text-sm font-medium text-white truncate">{discordUsername}</span>
                            </div>
                            <a href={`/api/discord/link?userId=${user?.id}`} className="text-[10px] uppercase font-bold text-[#5865F2] hover:text-white transition-colors">Relink</a>
                          </div>
                        ) : (
                          <a href={`/api/discord/link?userId=${user?.id}`} className="w-full flex items-center justify-center gap-2 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 text-[#5865F2] font-semibold py-2 rounded-xl transition-colors text-sm">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" /></svg>
                            Link Discord
                          </a>
                        )}
                      </div>

                    </div>

                    {/* Right Column: Details & Editing */}
                    <div className="flex-1 mt-4 md:mt-2 space-y-6">
                      
                      {/* Display Name */}
                      <div>
                        <label className="block text-xs font-bold tracking-widest text-gray-500 mb-2 uppercase">Display Name</label>
                        <input 
                          type="text" 
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full bg-transparent border-b-2 border-white/10 px-0 py-2 text-2xl font-bold text-white focus:outline-none focus:border-accent transition-colors placeholder:text-gray-600"
                          placeholder="Your Nickname"
                        />
                      </div>

                      {/* Bio */}
                      <div>
                        <label className="block text-xs font-bold tracking-widest text-gray-500 mb-2 uppercase">About Me</label>
                        <textarea 
                          value={newBio}
                          onChange={(e) => setNewBio(e.target.value)}
                          rows={4}
                          className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-gray-300 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all font-medium resize-none placeholder:text-gray-600"
                          placeholder="Write something about yourself..."
                        />
                      </div>

                      {/* Statistics Preview */}
                      <div>
                        <label className="block text-xs font-bold tracking-widest text-gray-500 mb-2 uppercase">Public Statistics</label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 flex flex-col justify-center items-center">
                            <span className="text-2xl font-bold text-white">{totalOrders}</span>
                            <span className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Orders</span>
                          </div>
                          <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 flex flex-col justify-center items-center">
                            <span className="text-2xl font-bold text-white">€{totalSpent.toFixed(2)}</span>
                            <span className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Spent</span>
                          </div>
                        </div>
                      </div>

                      {/* Privacy Toggle */}
                      <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-white/5 rounded-xl">
                        <div>
                          <div className="text-sm font-bold text-white mb-1">Private Profile</div>
                          <div className="text-xs text-gray-500 font-medium">Hide your profile from public view. Only you can see it.</div>
                        </div>
                        <button
                          onClick={() => setIsPrivate(!isPrivate)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${isPrivate ? 'bg-accent' : 'bg-white/10'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isPrivate ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>

                      {/* Save Button */}
                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        {profileMessage ? (
                          <span className={`text-sm font-semibold animate-in fade-in ${profileMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {profileMessage.text}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500 font-medium">Save your changes to update your public profile.</span>
                        )}
                        <button 
                          onClick={handleUpdateProfile}
                          disabled={profileUpdating}
                          className="bg-accent text-white font-bold rounded-xl px-8 py-3 hover:bg-accent/80 transition-all hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                        >
                          {profileUpdating ? (
                            <>
                              <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Saving...
                            </>
                          ) : "Save Profile"}
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Statystyki */}
                <div className="bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors duration-500" />
                  <div className="flex items-center gap-3 mb-4 relative z-10">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                      <TrendingUp className="w-5 h-5 text-gray-300 group-hover:text-accent transition-colors" />
                    </div>
                    <p className="text-gray-400 text-sm font-semibold tracking-wider uppercase">Total Spent</p>
                  </div>
                  <p className="text-4xl font-bold text-white font-mono mb-2 relative z-10 tracking-tight">€{totalSpent.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 font-medium relative z-10">{totalOrders} {totalOrders === 1 ? 'Order' : 'Orders'} Completed</p>
                </div>

                {/* Sekcja Balansu */}
                <div className="bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors duration-500" />
                  
                  <div className="flex items-center gap-3 mb-4 relative z-10">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                      <Wallet className="w-5 h-5 text-gray-300 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <p className="text-gray-400 text-sm font-semibold tracking-wider uppercase">Available Funds</p>
                  </div>
                  
                  <div className="flex items-end justify-between relative z-10 mt-1">
                    <p className="text-4xl font-bold text-white font-mono tracking-tight">€{balance.toFixed(2)}</p>
                    <button 
                      onClick={() => window.dispatchEvent(new Event('open-topup'))}
                      className="bg-white hover:bg-gray-200 text-black font-bold px-5 py-2.5 rounded-xl transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-2 text-sm shadow-lg"
                    >
                      <Plus className="w-4 h-4" /> Top Up
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                {/* Purchase History Header + Status Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#141414] border border-white/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Purchase History</h2>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
                    {(['all', 'completed', 'pending', 'cancelled', 'failed', 'refunded'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => { setOrderStatusFilter(status); setOrdersPage(1); }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-widest border transition-all ${
                          orderStatusFilter === status
                            ? status === 'completed' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                            : status === 'pending' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
                            : status === 'cancelled' ? 'bg-gray-500/20 border-gray-500/30 text-gray-300'
                            : status === 'failed' ? 'bg-red-500/20 border-red-500/30 text-red-400'
                            : status === 'refunded' ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
                            : 'bg-white/10 border-white/20 text-white'
                            : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {orders.length === 0 ? (
                  <div className="bg-[#141414] border border-white/5 rounded-3xl p-16 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/5 rounded-full blur-[80px]" />
                    <div className="relative z-10">
                      <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">No orders yet</h3>
                      <p className="text-gray-400 mb-8 max-w-sm mx-auto">Your inventory is currently empty. Browse our store to find your perfect account.</p>
                      <Link href="/" className="inline-flex items-center gap-2 bg-white text-black font-bold rounded-xl px-8 py-3.5 hover:bg-gray-200 transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                        <ShoppingBag className="w-5 h-5" />
                        Browse Store
                      </Link>
                    </div>
                  </div>
                ) : (() => {
                  const filteredOrders = orderStatusFilter === 'all' ? orders : orders.filter((o: any) => o.status === orderStatusFilter);
                  return (
                  <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col min-h-[820px]">
                    <div className="space-y-6 flex-1">
                      {filteredOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
                          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-500" />
                          </div>
                          <p className="text-gray-500 font-medium">No {orderStatusFilter} orders found</p>
                          <button onClick={() => setOrderStatusFilter('all')} className="text-xs text-accent underline">Show all orders</button>
                        </div>
                      ) : filteredOrders.slice((ordersPage - 1) * 5, ordersPage * 5).map((order) => {
                      const pInfo = products.find(p => p.id === order.product_id);
                      // In the future, you can add an `icon` field to `products` and do: const Icon = pInfo?.icon || Gamepad;
                      const ProductIcon = Gamepad;
                      
                      const accounts = order.accounts_data
                        ? order.accounts_data
                            .split(/\\n|\n/)
                            .map((t: string) => t.trim())
                            .filter((t: string) => t.length > 0 && !t.startsWith('[') && t.includes(':'))
                        : [];
                      
                      return (
                        <Link href={`/order/${order.id}`} key={order.id} className="block bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 relative group overflow-hidden hover:border-white/10 hover:shadow-xl transition-all cursor-pointer">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                          
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-12 rounded-xl border border-white/10 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform overflow-hidden relative bg-black/50">
                                {order.product_id === "topup" ? (
                                  <Wallet className="w-6 h-6 text-accent z-10" />
                                ) : (
                                  <Image 
                                    src={order.product_id === "prime" ? "/prime-bg.png" : "/premier-bg.jpg"} 
                                    alt={pInfo?.name || "Product"} 
                                    fill 
                                    className="object-cover scale-[1.15]"
                                  />
                                )}
                                <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                              </div>
                              <div>
                                {order.product_id === "topup" ? (
                                  <div className="text-[10px] uppercase tracking-widest font-bold text-accent mb-0.5">Store Balance</div>
                                ) : (
                                  <div className="text-[10px] uppercase tracking-widest font-bold text-emerald-500 mb-0.5">Counter Strike 2</div>
                                )}
                                <div className="font-bold text-white text-lg tracking-tight group-hover:text-emerald-400 transition-colors">
                                  {order.product_id === "topup" ? "Balance Top-up" : pInfo?.name || "Premier Ready"}
                                </div>
                                <div className="text-xs text-gray-500 font-mono mt-1">#{order.id.split('-')[0]} • {new Date(order.created_at).toLocaleString('en-GB')}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 sm:gap-6 bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                              <div className="hidden sm:block text-right">
                                <div className="text-[10px] uppercase text-gray-500 font-bold mb-0.5 tracking-widest">Payment</div>
                                <div className="text-sm font-semibold text-gray-300">
                                  {order.product_id === 'topup' 
                                    ? 'Crypto' 
                                    : order.accounts_data?.toLowerCase().includes('oxapay') || order.accounts_data?.toLowerCase().includes('crypto') 
                                      ? 'Crypto' 
                                      : order.accounts_data?.toLowerCase().includes('stripe') 
                                        ? 'Stripe' 
                                        : 'Balance'}
                                </div>
                              </div>
                              <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
                              <div className="text-right">
                                <div className="text-[10px] uppercase text-gray-500 font-bold mb-0.5 tracking-widest">Total</div>
                                <div className="font-mono text-white text-xl font-bold tracking-tight">€{Number(order.total_price).toFixed(2)}</div>
                              </div>
                              <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
                              <div className={`inline-flex flex-col items-center justify-center px-4 py-1.5 rounded-lg border min-w-[80px] ${
                                order.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                order.status === 'failed' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                order.status === 'cancelled' ? 'bg-gray-500/10 border-gray-500/20 text-gray-400' :
                                order.status === 'refunded' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                                'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                              }`}>
                                <div className="text-lg font-black leading-none">{order.product_id === 'topup' ? '€' : order.quantity}</div>
                                <div className="text-[9px] uppercase tracking-widest font-bold opacity-80 mt-0.5">
                                  {order.product_id === 'topup' ? "Top-up" : order.quantity === 1 ? "Account" : "Accounts"}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {order.status === 'completed' && order.product_id !== 'topup' && (
                            <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                            {order.reviews ? (
                              <button
                                disabled
                                className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 z-20 relative cursor-not-allowed opacity-80"
                              >
                                ✓ Already Reviewed
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setReviewOrder(order);
                                  setReviewComment("");
                                  setReviewRating(5);
                                  setReviewModalOpen(true);
                                }}
                                className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 z-20 relative"
                              >
                                ⭐ Leave a Review
                              </button>
                            )}
                            </div>
                          )}
                        </Link>
                      );
                    })}
                    </div>

                    {/* Pagination Controls */}
                    {filteredOrders.length > 0 && (
                      <div className="flex items-center justify-center gap-2 pt-6 border-t border-white/5 mt-auto">
                        <button
                          onClick={() => setOrdersPage(Math.max(1, ordersPage - 1))}
                          disabled={ordersPage === 1}
                          className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 rounded-xl transition-all"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-400" />
                        </button>
                        
                        <div className="flex items-center gap-2 px-2">
                          {Array.from({ length: Math.ceil(filteredOrders.length / 5) }).map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setOrdersPage(i + 1)}
                              className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
                                ordersPage === i + 1 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => setOrdersPage(Math.min(Math.ceil(filteredOrders.length / 5), ordersPage + 1))}
                          disabled={ordersPage === Math.ceil(filteredOrders.length / 5)}
                          className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 rounded-xl transition-all"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>
                    )}
                  </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TICKETS TAB */}
          {activeTab === 'tickets' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#141414] border border-white/10 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-gray-300" />
                  </div>
                  Support Tickets
                </h2>
                <Link href="/support" className="text-xs bg-accent hover:bg-accent/80 text-white font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-lg">
                  <Plus className="w-4 h-4" />
                  Open Ticket
                </Link>
              </div>

              <div className="bg-[#141414] border border-white/5 rounded-3xl p-4 md:p-8 shadow-2xl relative overflow-hidden min-h-[400px] flex flex-col">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
                
                {tickets.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto z-10 py-10">
                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                      <MessageSquare className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No tickets yet</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                      You haven't opened any support tickets. If you need help, feel free to contact us.
                    </p>
                    <Link href="/support">
                      <button className="bg-white text-black hover:bg-gray-200 font-bold rounded-xl px-8 py-3 transition-colors text-sm flex items-center justify-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Get Support
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 z-10 flex-1 content-start">
                    {tickets.slice((ticketsPage - 1) * 5, ticketsPage * 5).map((ticket, i) => (
                      <div key={ticket.id} className="bg-[#0a0a0a] rounded-2xl border border-white/5 hover:border-white/10 transition-colors p-4 md:p-6 group relative overflow-hidden flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                        <div className="flex-1 min-w-0 flex items-start gap-4">
                          <div className={`shrink-0 w-12 h-12 rounded-full border flex items-center justify-center ${ticket.status === 'open' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-gray-500/10 border-gray-500/30'}`}>
                            <MessageSquare className={`w-5 h-5 ${ticket.status === 'open' ? 'text-emerald-400' : 'text-gray-400'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-bold text-white text-lg truncate">Ticket #{ticket.ticket_number || ticket.id.split('-')[0]}</h3>
                              <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border ${ticket.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                {ticket.status}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 font-medium mb-1">
                              Subject: <span className="text-gray-300">{ticket.issue_type.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">
                              Created: {new Date(ticket.created_at).toLocaleString('en-GB')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:ml-auto">
                          {ticket.status === 'open' && (
                            <button 
                              onClick={() => {
                                localStorage.setItem('larpsense_ticket_session', ticket.ticket_number.toString());
                                window.location.href = '/support';
                              }}
                              className="flex-1 sm:flex-none text-xs bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-center cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              Resume Chat
                            </button>
                          )}
                          {ticket.transcript_url && (
                            <button 
                              onClick={() => handleViewTranscript(ticket.transcript_url)}
                              className="flex-1 sm:flex-none text-xs bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-center cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              View Transcript
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Pagination Controls */}
                {tickets.length > 5 && (
                  <div className="flex items-center justify-center gap-2 pt-6 border-t border-white/5 mt-auto z-10">
                    <button
                      onClick={() => setTicketsPage(Math.max(1, ticketsPage - 1))}
                      disabled={ticketsPage === 1}
                      className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 rounded-xl transition-all"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    
                    <div className="flex items-center gap-2 px-2">
                      {Array.from({ length: Math.ceil(tickets.length / 5) }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setTicketsPage(i + 1)}
                          className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
                            ticketsPage === i + 1 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setTicketsPage(Math.min(Math.ceil(tickets.length / 5), ticketsPage + 1))}
                      disabled={ticketsPage === Math.ceil(tickets.length / 5)}
                      className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 rounded-xl transition-all"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#141414] border border-white/10 flex items-center justify-center">
                    <Star className="w-5 h-5 text-gray-300" />
                  </div>
                  My Reviews
                </h2>
              </div>

              <div className="bg-[#141414] border border-white/5 rounded-3xl p-4 md:p-8 shadow-2xl relative overflow-hidden min-h-[400px] flex flex-col">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
                
                {myReviews.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto z-10 py-10">
                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                      <Star className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No reviews yet</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                      You haven't submitted any reviews. Purchase a product to share your feedback.
                    </p>
                    <button onClick={() => handleTabChange('orders')} className="bg-white text-black hover:bg-gray-200 font-bold rounded-xl px-8 py-3 transition-colors text-sm flex items-center justify-center gap-2">
                      <LayoutGrid className="w-4 h-4" />
                      View My Orders
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 z-10 flex-1 content-start">
                    {myReviews.slice((myReviewsPage - 1) * 8, myReviewsPage * 8).map((review) => (
                      <div key={review.id} className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-5 relative overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
                          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                            {products.find(p => p.id === review.product_type)?.name || review.product_type}
                          </div>
                          <div className="flex text-yellow-500">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star key={idx} className={`w-3.5 h-3.5 ${idx < review.rating ? 'fill-current' : 'text-gray-700'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-300 italic text-sm mb-4 line-clamp-3 leading-relaxed">
                          "{review.comment || 'Great service!'}"
                        </p>
                        <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/5">
                          <span className="text-[10px] text-gray-500 font-bold">{new Date(review.created_at).toLocaleDateString()}</span>
                          <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded ${review.is_published ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                            {review.is_published ? 'Published' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Pagination Controls */}
                {myReviews.length > 8 && (
                  <div className="flex items-center justify-center gap-2 pt-6 border-t border-white/5 mt-auto z-10">
                    <button
                      onClick={() => setMyReviewsPage(Math.max(1, myReviewsPage - 1))}
                      disabled={myReviewsPage === 1}
                      className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 rounded-xl transition-all"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    
                    <div className="flex items-center gap-2 px-2">
                      {Array.from({ length: Math.ceil(myReviews.length / 8) }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setMyReviewsPage(i + 1)}
                          className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
                            myReviewsPage === i + 1 
                              ? 'bg-accent/10 text-accent border border-accent/20' 
                              : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setMyReviewsPage(Math.min(Math.ceil(myReviews.length / 8), myReviewsPage + 1))}
                      disabled={myReviewsPage === Math.ceil(myReviews.length / 8)}
                      className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 rounded-xl transition-all"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#141414] border border-white/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-gray-300" />
                </div>
                Security Settings
              </h2>
              
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-wrap gap-2 md:gap-4 mb-8 border-b border-white/10 pb-4">
                  <button 
                    onClick={() => setSecurityTab('overview')} 
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${securityTab === 'overview' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                  >
                    Overview
                  </button>
                  <button 
                    onClick={() => setSecurityTab('sessions')} 
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${securityTab === 'sessions' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                  >
                    Active Sessions
                  </button>
                  <button 
                    onClick={() => setSecurityTab('history')} 
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${securityTab === 'history' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                  >
                    Login History
                  </button>
                </div>

                {securityTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {isGoogleLogin ? (
                    <div className="lg:col-span-2 bg-[#141414] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                      <div className="absolute -right-4 -top-4 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
                      <h3 className="font-bold text-xl text-white flex items-center gap-3 mb-3 relative z-10">
                        <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-inner">
                          <Lock className="w-4 h-4 text-red-400" />
                        </div>
                        Security Restriction
                      </h3>
                      <p className="text-gray-400 max-w-lg leading-relaxed relative z-10">
                        Password or email change is not possible - you are logged in via Google. Please manage your security settings directly through your Google account.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Change Password */}
                    <div className="bg-[#141414] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                      <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors duration-500 pointer-events-none" />
                      
                      <h3 className="font-bold text-xl text-white flex items-center gap-3 mb-3 relative z-10">
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                          <KeyRound className="w-4 h-4 text-accent" />
                        </div>
                        Change Password
                      </h3>
                      
                      <p className="text-sm text-gray-400 mb-6 leading-relaxed relative z-10">
                        We will send a secure password reset link directly to your email address <span className="text-gray-200 font-medium">({user.email})</span>.
                      </p>

                      <button 
                        onClick={handlePasswordResetRequest}
                        disabled={passwordUpdating}
                        className="bg-white/5 border border-white/10 text-white font-semibold rounded-xl px-6 py-3 hover:bg-white/10 transition-colors disabled:opacity-50 relative z-10 shadow-lg"
                      >
                        {passwordUpdating ? "Sending..." : "Send Reset Email"}
                      </button>
                    </div>

                    {/* Change Email */}
                    <div className="bg-[#141414] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                      <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors duration-500 pointer-events-none" />
                      
                      <h3 className="font-bold text-xl text-white flex items-center gap-3 mb-3 relative z-10">
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                          <Mail className="w-4 h-4 text-accent" />
                        </div>
                        Change Email
                      </h3>
                      
                      <p className="text-sm text-gray-400 mb-4 leading-relaxed relative z-10">
                        Enter your new email address below. You will receive a confirmation link on your new email.
                      </p>
                      
                      <div className="space-y-4 relative z-10 flex gap-2">
                        <input 
                          type="email" 
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all font-medium"
                          placeholder="new.email@example.com"
                        />
                        <button 
                          onClick={handleUpdateEmail}
                          disabled={emailUpdating || !newEmail || newEmail === user.email}
                          className="bg-white/5 border border-white/10 text-white font-semibold rounded-xl px-6 py-3 hover:bg-white/10 transition-colors disabled:opacity-50 shadow-lg"
                        >
                          {emailUpdating ? "Sending..." : "Update"}
                        </button>
                      </div>
                    </div>

                    {/* Recovery Email */}
                    <div className="bg-[#141414] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                      <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors duration-500 pointer-events-none" />
                      
                      <h3 className="font-bold text-xl text-white flex items-center gap-3 mb-3 relative z-10">
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                          <ShieldCheck className="w-4 h-4 text-accent" />
                        </div>
                        Recovery Options
                      </h3>
                      
                      <p className="text-sm text-gray-400 mb-4 leading-relaxed relative z-10">
                        Add an alternative email address in case you lose access to your primary email account.
                      </p>
                      
                      <div className="space-y-4 relative z-10 flex gap-2">
                        <input 
                          type="email" 
                          value={recoveryEmail}
                          onChange={(e) => setRecoveryEmail(e.target.value)}
                          className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all font-medium"
                          placeholder="recovery.email@example.com"
                        />
                        <button 
                          onClick={handleUpdateRecoveryEmail}
                          className="bg-white/5 border border-white/10 text-white font-semibold rounded-xl px-6 py-3 hover:bg-white/10 transition-colors shadow-lg shrink-0"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                    </>
                  )}
                  </div>
                  )}

                  {securityTab === 'history' && (
                    <div className="bg-[#141414] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                      <h3 className="font-bold text-xl text-white flex items-center gap-3 mb-3 relative z-10">
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                          <RefreshCw className="w-4 h-4 text-accent" />
                        </div>
                        Login History
                      </h3>
                      <p className="text-sm text-gray-400 mb-6 leading-relaxed relative z-10">
                        History of your recent logins and logouts.
                      </p>
                      
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                        {loginActivity.length > 0 ? (
                          loginActivity.map(log => (
                            <div key={log.id} className="flex justify-between items-center text-sm border-b border-white/5 pb-3 pt-1 last:border-0 last:pb-0 gap-4">
                              <span className="text-gray-300 truncate w-32 font-medium">{log.user_agent}</span>
                              <span className="text-gray-500 text-xs truncate w-28">{log.ip_address}</span>
                              <span className="text-gray-500 text-xs text-center flex-1">{new Date(log.created_at).toLocaleString()}</span>
                              <span className={`text-xs font-bold uppercase tracking-wider ${log.action === 'logout' ? 'text-red-400' : 'text-accent'}`}>{log.action || 'login'}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-gray-500 text-sm bg-[#0a0a0a] rounded-xl border border-white/5">
                            <p>No history found.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {securityTab === 'sessions' && (
                    <div className="bg-[#141414] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                      <h3 className="font-bold text-xl text-white flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                          <LayoutGrid className="w-4 h-4 text-accent" />
                        </div>
                        Active Sessions
                      </h3>
                      
                      <div className="bg-[#0a0a0a] rounded-xl border border-white/5 overflow-hidden">
                        {(() => {
                          const map = new Map();
                          loginActivity.forEach(log => {
                            const key = `${log.user_agent}-${log.ip_address}`;
                            if (!map.has(key)) map.set(key, log);
                          });
                          const active = Array.from(map.values()).filter(log => log.action !== 'logout');
                          
                          if (active.length === 0) {
                            return (
                              <div className="text-center py-10 text-gray-500">
                                <p className="text-lg mb-2">No active sessions found.</p>
                              </div>
                            );
                          }

                          return (
                            <div className="divide-y divide-white/5">
                              {active.map((session, index) => (
                                <div key={session.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                  <div className="flex items-center gap-5">
                                    <div className="text-gray-400 bg-white/5 p-3 rounded-xl border border-white/5">
                                      {session.user_agent.toLowerCase().includes('phone') || session.user_agent.toLowerCase().includes('iphone') 
                                        ? <Smartphone className="w-6 h-6" /> 
                                        : <Monitor className="w-6 h-6" />}
                                    </div>
                                    <div>
                                      <div className="font-bold text-gray-200 text-base flex items-center gap-3">
                                        {session.user_agent} 
                                        {index === 0 && <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Current</span>}
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5">
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                          <div className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden">
                                            {profile?.avatar_url ? (
                                              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                              <UserIcon className="w-2.5 h-2.5 text-accent" />
                                            )}
                                          </div>
                                          {user?.email?.split('@')[0]}
                                        </div>
                                        <span>•</span>
                                        <span>{new Date(session.created_at).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span className="uppercase font-medium">{session.location.split(', ').pop()}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={async () => {
                                      if (index === 0) {
                                        await fetch("/api/auth/log-session", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
                                          body: JSON.stringify({ action: "logout" })
                                        }).catch(() => {});
                                        await supabase.auth.signOut();
                                        window.location.href = "/";
                                      } else {
                                        // Insert logout record for this specific device
                                        await supabase.from('login_activity').insert({
                                          user_id: user.id,
                                          ip_address: session.ip_address,
                                          location: session.location,
                                          user_agent: session.user_agent,
                                          action: 'logout'
                                        });
                                        
                                        // Broadcast force logout to that specific device
                                        await supabase.channel('online_users').send({
                                          type: 'broadcast',
                                          event: 'force_logout',
                                          payload: { scope: 'device', userId: user.id, ipAddress: session.ip_address, userAgent: session.user_agent }
                                        });
                                        
                                        fetchLoginActivity(user.id);
                                      }
                                    }}
                                    className="text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-lg border border-white/10 shrink-0"
                                    title={index === 0 ? "Log out of current device" : "Log out of this device"}
                                  >
                                    {index === 0 ? "Log out (Current)" : "Log out device"}
                                  </button>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                      
                      <div className="mt-6 flex justify-end">
                        <button 
                          onClick={handleLogoutAllOtherDevices}
                          disabled={loggingOutDevices}
                          className="bg-white/5 border border-white/10 text-white font-semibold rounded-xl px-8 py-3 hover:bg-white/10 transition-colors disabled:opacity-50 shadow-lg"
                        >
                          {loggingOutDevices ? "Logging out..." : "Log out of all other devices"}
                        </button>
                      </div>
                    </div>
                  )}

                  {securityTab === 'overview' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <h3 className="font-bold text-xl text-red-400 flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shadow-inner">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </div>
                      Danger Zone: Delete Account
                    </h3>
                    <p className="text-sm text-red-200/70 mb-4 leading-relaxed max-w-2xl">
                      Once you delete your account, there is no going back. Please be certain. All your data, orders, and balances will be permanently destroyed.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-lg">
                      <input 
                        type="text" 
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Type DELETE to confirm"
                        className="flex-1 bg-[#0a0a0a] border border-red-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-medium"
                      />
                      <button 
                        onClick={handleDeleteAccount}
                        disabled={deletingAccount || deleteConfirmText !== "DELETE"}
                        className="bg-red-500 text-white font-semibold rounded-xl px-6 py-3 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:hover:bg-red-500 shadow-lg shrink-0"
                      >
                        {deletingAccount ? "Deleting..." : "Permanently Delete"}
                      </button>
                    </div>
                    </div>
                  )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>

      {/* Badges Modal */}
      {isBadgesModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsBadgesModalOpen(false)}>
          <div className="bg-[#141414] border border-white/10 rounded-3xl overflow-hidden w-full max-w-2xl shadow-2xl relative flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0a0a0a]">
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-accent" />
                <h3 className="font-bold text-white text-lg">Available Badges</h3>
              </div>
              <button onClick={() => setIsBadgesModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20 transition-colors">
              
              {/* Mini Profile Header */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#0a0a0a] border border-white/5">
                <div className="relative w-14 h-14 rounded-full border-2 border-white/10 overflow-hidden shrink-0">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#141414] flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Signed in as</div>
                  <div className="font-bold text-white text-base truncate">{newName || user?.email?.split('@')[0]}</div>
                  <div className="text-xs text-gray-400 truncate">{user?.email}</div>
                </div>
                <div className="shrink-0 text-right hidden sm:block">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Current Rank</div>
                  {totalSpent >= 250 ? (
                    <div className="flex items-center justify-end gap-1.5 text-cyan-400"><Gem className="w-3.5 h-3.5" /><span className="text-xs font-bold uppercase tracking-widest">VIP Status</span></div>
                  ) : totalSpent >= 50 ? (
                    <div className="flex items-center justify-end gap-1.5 text-yellow-400"><Coins className="w-3.5 h-3.5" /><span className="text-xs font-bold uppercase tracking-widest">Premium Tier</span></div>
                  ) : totalOrders > 0 ? (
                    <div className="flex items-center justify-end gap-1.5 text-green-400"><ShoppingBag className="w-3.5 h-3.5" /><span className="text-xs font-bold uppercase tracking-widest">Verified Buyer</span></div>
                  ) : (
                    <div className="flex items-center justify-end gap-1.5 text-gray-400"><UserPlus className="w-3.5 h-3.5" /><span className="text-xs font-bold uppercase tracking-widest">Registered</span></div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Time-based Badges</h4>
                <div className="grid grid-cols-1 gap-3">
                  {ALL_TIME_BADGES.map((badge, idx) => {
                    const isOwned = accountAgeDays >= badge.daysReq;
                    return (
                      <div key={idx} className={`flex items-center gap-4 p-3 rounded-2xl border ${isOwned ? 'bg-[#0a0a0a] border-white/10' : 'bg-transparent border-transparent opacity-50 grayscale'}`}>
                        <div className={`p-3 rounded-xl border shrink-0 ${isOwned ? badge.bg : 'bg-white/5 border-white/10'} ${isOwned ? badge.glow : ''}`}>
                          <badge.Icon className={`w-6 h-6 ${isOwned ? badge.color : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1">
                          <div className={`font-bold text-sm ${isOwned ? badge.color : 'text-gray-400'}`}>{badge.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{badge.desc}</div>
                        </div>
                        {isOwned && <div className="text-[10px] uppercase font-bold text-accent tracking-widest px-2">Owned</div>}
                        {!isOwned && <div className="text-[10px] uppercase font-bold text-gray-600 tracking-widest px-2">{badge.daysReq} Days</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Purchase Badges</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className={`flex items-center gap-4 p-3 rounded-2xl border ${totalOrders > 0 ? 'bg-[#0a0a0a] border-white/10' : 'bg-transparent border-transparent opacity-50 grayscale'}`}>
                    <div className={`p-3 rounded-xl border shrink-0 ${totalOrders > 0 ? 'bg-green-500/10 border-green-500/20 shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-white/5 border-white/10'}`}>
                      <ShoppingBag className={`w-6 h-6 ${totalOrders > 0 ? 'text-green-400' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className={`font-bold text-sm ${totalOrders > 0 ? 'text-green-400' : 'text-gray-400'}`}>Verified Buyer</div>
                      <div className="text-xs text-gray-500 mt-1">Has purchased at least one item from the store.</div>
                    </div>
                    {totalOrders > 0 && <div className="text-[10px] uppercase font-bold text-accent tracking-widest px-2">Owned</div>}
                    {totalOrders === 0 && <div className="text-[10px] uppercase font-bold text-gray-600 tracking-widest px-2">0/1 Orders</div>}
                  </div>

                  <div className={`flex items-center gap-4 p-3 rounded-2xl border ${totalSpent >= 25 ? 'bg-[#0a0a0a] border-white/10' : 'bg-transparent border-transparent opacity-50 grayscale'}`}>
                    <div className={`p-3 rounded-xl border shrink-0 ${totalSpent >= 25 ? 'bg-purple-500/10 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-white/5 border-white/10'}`}>
                      <Star className={`w-6 h-6 ${totalSpent >= 25 ? 'text-purple-400' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className={`font-bold text-sm ${totalSpent >= 25 ? 'text-purple-400' : 'text-gray-400'}`}>Supporter Tier</div>
                      <div className="text-xs text-gray-500 mt-1">Accumulative spend over $25.00.</div>
                    </div>
                    {totalSpent >= 25 && <div className="text-[10px] uppercase font-bold text-accent tracking-widest px-2">Owned</div>}
                    {totalSpent < 25 && <div className="text-[10px] uppercase font-bold text-gray-600 tracking-widest px-2">${totalSpent.toFixed(2)} / $25.00</div>}
                  </div>

                  <div className={`flex items-center gap-4 p-3 rounded-2xl border ${totalSpent >= 50 ? 'bg-[#0a0a0a] border-white/10' : 'bg-transparent border-transparent opacity-50 grayscale'}`}>
                    <div className={`p-3 rounded-xl border shrink-0 ${totalSpent >= 50 ? 'bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-white/5 border-white/10'}`}>
                      <Coins className={`w-6 h-6 ${totalSpent >= 50 ? 'text-yellow-400' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className={`font-bold text-sm ${totalSpent >= 50 ? 'text-yellow-400' : 'text-gray-400'}`}>Premium Tier</div>
                      <div className="text-xs text-gray-500 mt-1">Accumulative spend over $50.00.</div>
                    </div>
                    {totalSpent >= 50 && <div className="text-[10px] uppercase font-bold text-accent tracking-widest px-2">Owned</div>}
                    {totalSpent < 50 && <div className="text-[10px] uppercase font-bold text-gray-600 tracking-widest px-2">${totalSpent.toFixed(2)} / $50.00</div>}
                  </div>

                  <div className={`flex items-center gap-4 p-3 rounded-2xl border ${totalSpent >= 250 ? 'bg-[#0a0a0a] border-white/10' : 'bg-transparent border-transparent opacity-50 grayscale'}`}>
                    <div className={`p-3 rounded-xl border shrink-0 ${totalSpent >= 250 ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'bg-white/5 border-white/10'}`}>
                      <Gem className={`w-6 h-6 ${totalSpent >= 250 ? 'text-cyan-400' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className={`font-bold text-sm ${totalSpent >= 250 ? 'text-cyan-400' : 'text-gray-400'}`}>VIP Status</div>
                      <div className="text-xs text-gray-500 mt-1">Exclusive status for $250.00+ spend.</div>
                    </div>
                    {totalSpent >= 250 && <div className="text-[10px] uppercase font-bold text-accent tracking-widest px-2">Owned</div>}
                    {totalSpent < 250 && <div className="text-[10px] uppercase font-bold text-gray-600 tracking-widest px-2">${totalSpent.toFixed(2)} / $250.00</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-[60vh]"><div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin"></div></div>}>
      <DashboardContent />
    </Suspense>
  );
}
