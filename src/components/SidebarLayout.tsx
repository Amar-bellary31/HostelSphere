"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Users2,
  FolderTree,
  UserCheck,
  History,
  LogOut,
  Menu,
  X,
  User,
  Activity,
} from "lucide-react";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Hostels", href: "/hostels", icon: Building2 },
    { name: "Rooms", href: "/rooms", icon: DoorOpen },
    { name: "Students", href: "/students", icon: Users2 },
    { name: "Furniture", href: "/furniture", icon: FolderTree },
    { name: "Visitors", href: "/visitors", icon: UserCheck },
    { name: "Activity Logs", href: "/logs", icon: History },
  ];

  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0">
        {/* Brand */}
        <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-800 bg-slate-900/50">
          <Activity className="w-6 h-6 text-indigo-400" />
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            HostelSphere
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? "text-white" : "text-slate-400 group-hover:text-slate-100"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile / Logout footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/50 mb-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 font-semibold">
              {user?.fname?.[0] || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-slate-200">
                {user?.fname} {user?.lname}
              </p>
              <p className="text-xs text-slate-400 truncate">@{user?.username}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header / Sidebar Toggle */}
      <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-indigo-400" />
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            HostelSphere
          </span>
        </div>
        <button
          onClick={toggleMobileSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={toggleMobileSidebar}
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside
        className={`md:hidden fixed top-0 bottom-0 left-0 w-64 bg-slate-900 border-r border-slate-800 z-50 transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-400" />
            <span className="font-bold text-lg tracking-tight text-white">
              HostelSphere
            </span>
          </div>
          <button
            onClick={toggleMobileSidebar}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/50 mb-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 font-semibold">
              {user?.fname?.[0] || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-slate-200">
                {user?.fname} {user?.lname}
              </p>
              <p className="text-xs text-slate-400 truncate">@{user?.username}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setMobileOpen(false);
              logout();
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
        {/* Desktop Header Topbar */}
        <header className="hidden md:flex h-16 items-center justify-between px-8 border-b border-slate-900 bg-slate-950/50 backdrop-blur-md sticky top-0 z-30">
          <h1 className="text-sm font-medium text-slate-400">
            Welcome <span className="text-indigo-400 font-semibold">{user?.fname || "amar"}</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-500 font-mono">
              System Live • DB Connected
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
