"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import {
  getBrowserSupabase,
  isSupabaseEnabled,
} from "@/lib/supabase/client";
import type { Role } from "@/lib/supabase/types";

type SessionState = {
  email: string;
  fullName: string | null;
  role: Role;
} | null;

export function UserMenu() {
  const [session, setSession] = useState<SessionState>(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseEnabled()) {
      setReady(true);
      return;
    }
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setReady(true);
      return;
    }

    async function loadUser() {
      const {
        data: { user },
      } = await supabase!.auth.getUser();
      if (!user) {
        setSession(null);
        setReady(true);
        return;
      }
      const { data: profile } = await supabase!
        .from("profiles")
        .select("role, full_name, email")
        .eq("id", user.id)
        .maybeSingle();
      setSession({
        email: profile?.email ?? user.email ?? "",
        fullName: profile?.full_name ?? null,
        role: (profile?.role as Role) ?? "user",
      });
      setReady(true);
    }
    loadUser();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setSession(null);
      else if (event === "SIGNED_IN") loadUser();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function logout() {
    const supabase = getBrowserSupabase();
    await supabase?.auth.signOut();
    setSession(null);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  if (!isSupabaseEnabled() || !ready) return null;

  if (!session) {
    return (
      <Link
        href="/auth/login"
        className="hidden lg:inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm text-ocean-700 hover:bg-lagon-100"
      >
        <User size={16} />
        Connexion
      </Link>
    );
  }

  const initials = (session.fullName || session.email)
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const isStaff = session.role === "admin" || session.role === "editor";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-lagon-100 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-lagon-500 to-ocean-700 text-white text-xs font-semibold flex items-center justify-center">
          {initials || <User size={14} />}
        </span>
        <ChevronDown size={14} className="text-ocean-600" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 bg-white border border-ocean-100 rounded-2xl shadow-xl p-2 z-50"
        >
          <div className="px-3 py-2 border-b border-ocean-100 mb-1">
            <p className="text-sm font-semibold text-ocean-900 truncate">
              {session.fullName || "Visiteur"}
            </p>
            <p className="text-xs text-ocean-500 truncate">{session.email}</p>
            {isStaff && (
              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-tiare-100 text-tiare-700">
                {session.role}
              </span>
            )}
          </div>
          {isStaff && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ocean-800 hover:bg-lagon-50"
            >
              <LayoutDashboard size={14} />
              Tableau de bord
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-tiare-700 hover:bg-tiare-50"
          >
            <LogOut size={14} />
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}
