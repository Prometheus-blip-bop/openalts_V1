import React, { useState } from "react";
import { 
  Compass, 
  MessageSquare, 
  ArrowLeftRight, 
  Star, 
  PlusCircle, 
  User, 
  LogOut, 
  Menu, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Terminal,
  Flame,
  BookOpen,
  DollarSign,
  Users,
  Home,
  ShieldAlert
} from "lucide-react";
import { ViewType } from "../types";
import { User as FirebaseUser } from "firebase/auth";

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  user: FirebaseUser | null;
  onLogin: () => void;
  onLogout: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  projects?: any[];
}

export default function Sidebar({
  currentView,
  setView,
  user,
  onLogin,
  onLogout,
  isCollapsed,
  setIsCollapsed,
  projects = []
}: SidebarProps) {
  const menuItems = [
    { id: "landing" as ViewType, label: "Home Showcase", icon: Home, description: "Landing Page & Match Sandbox" },
    { id: "discover" as ViewType, label: "Project Discovery", icon: Compass, description: "Explore repos & SaaS alternatives" },
    { id: "opensource" as ViewType, label: "Open Source Market", icon: Terminal, description: "Discover GitHub repositories" },
    { id: "trending" as ViewType, label: "Trending Rankings", icon: Star, description: "Hottest fresh alternative index" },
    { id: "battle" as ViewType, label: "Versus Battlegrounds", icon: ShieldAlert, description: "Tug-of-war tribal tech warfare" },
    { id: "communitysaas" as ViewType, label: "Community SaaS", icon: Users, description: "Submit & browse curated SaaS" },
    { id: "compare" as ViewType, label: "AI Comparison", icon: ArrowLeftRight, description: "Compare openalt technologies" },
    { id: "aiplanner" as ViewType, label: "AI SaaS Planner", icon: Sparkles, description: "Plan zero-dollar development" },
    { id: "community" as ViewType, label: "Community Hub", icon: MessageSquare, description: "Discuss, post & share ideas" },
    { id: "blogs" as ViewType, label: "Tech Blogs", icon: BookOpen, description: "Engineering & Migration guides" },
    { id: "pricing" as ViewType, label: "Pricing", icon: DollarSign, description: "Curated pricing options & plans" },
    { id: "submit" as ViewType, label: "Submit Personal SaaS", icon: PlusCircle, description: "Add your own SaaS projects" },
  ];

  if (user) {
    menuItems.push({ id: "mysaas" as ViewType, label: "My SaaS Center", icon: User, description: "Manage your uploaded projects" });
  }

  // Sophisticated Daily Rotational Showcase Algorithm
  const showcased = React.useMemo(() => {
    if (!projects || projects.length === 0) return [];
    const dailySalt = new Date().getDate();

    const scoredList = projects.map((p) => {
      const upvotes = p.upvotes || 0;
      const rating = p.rating || 0;
      const stars = p.stars || 0;

      const charCodeSum = p.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const rotationFactor = Math.sin(charCodeSum + dailySalt) * 10;

      const baseScore = upvotes * 2 + rating * 6 + stars * 0.05;
      const finalScore = baseScore + rotationFactor;

      return { project: p, score: finalScore };
    });

    return scoredList
      .sort((a, b) => b.score - a.score)
      .slice(0, 1)
      .map(item => item.project);
  }, [projects]);

  return (
    <aside
      id="main-sidebar"
      className={`fixed top-0 left-0 z-40 h-screen border-r-4 border-black bg-[#fffdf5] transition-all duration-300 hidden md:flex flex-col justify-between select-none ${
        isCollapsed ? "w-18" : "w-64"
      }`}
    >
      {/* Top Banner Header & Nav Panel */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between p-4 border-b-4 border-black bg-[#fde047] h-[69px] shrink-0">
          <div
            onClick={() => setView("landing")}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black text-white border-2 border-black shadow-[2px_2px_0_0_#000000]">
              <Terminal className="h-5 w-5 text-[#fde047]" />
            </div>
            {!isCollapsed && (
              <div>
                <span className="font-sans font-black text-base lg:text-lg tracking-tight text-black flex items-center gap-1">
                  OpenAlt
                  <span className="text-[9px] font-mono py-0.5 px-1.5 rounded border border-black bg-white text-black font-extrabold uppercase">
                    v1.0
                  </span>
                </span>
                <p className="text-[9px] font-mono text-stone-800 font-bold uppercase">Alternative Hub</p>
              </div>
            )}
          </div>

          <button
            id="sidebar-toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded border-2 border-black bg-white p-1 text-black hover:bg-stone-100 shadow-[2px_2px_0_0_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4 stroke-[3px]" /> : <ChevronLeft className="h-4 w-4 stroke-[3px]" />}
          </button>
        </div>

        {/* Scrollable Navigation section */}
        <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
          {/* Navigation Options List */}
          <nav className="space-y-3 p-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              // assign different colors to different modules for that classic brutalist look
              const activeColors = {
                landing: "bg-[#fed7aa]",   // light orange
                discover: "bg-[#fde047]", // yellow
                opensource: "bg-[#ddd6fe]", // purple
                trending: "bg-[#fed7aa]", // orange-ish
                battle: "bg-[#fbcfe8]", // vibrant pink
                communitysaas: "bg-[#86efac]", // lime green
                compare: "bg-[#67e8f9]", // cyan
                aiplanner: "bg-[#86efac]", // vibrant green
                community: "bg-[#fbcfe8]", // pink
                blogs: "bg-[#67e8f9]", // cyan
                pricing: "bg-[#ddd6fe]", // purple
                submit: "bg-[#fed7aa]", // orange
                mysaas: "bg-[#ccdffd]" // light blue
              };

              const chosenBg = activeColors[item.id] || "bg-[#fde047]";

              return (
                <button
                  key={item.id}
                  id={`btn-nav-${item.id}`}
                  onClick={() => setView(item.id)}
                  className={`w-full group relative flex items-center gap-2.5 rounded-lg border-2 border-black p-2.5 text-xs font-black transition-all ${
                    isActive
                      ? `${chosenBg} text-black shadow-[4px_4px_0_0_#000000] translate-x-[-2px] translate-y-[-2px]`
                      : "bg-white text-stone-750 hover:bg-stone-50 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_#000000] shadow-[1px_1px_0_0_#000000]"
                  }`}
                >
                  <div className={`p-1 border-2 border-black rounded bg-white ${isActive ? "shadow-[1.5px_1.5px_0_0_#000000]" : "shadow-none"}`}>
                    <Icon className="h-4 w-4 shrink-0 stroke-[2.5px] text-black" />
                  </div>
                  {!isCollapsed && (
                    <div className="text-left min-w-0 flex-1">
                      <p className="font-black tracking-tight leading-none text-black truncate">{item.label}</p>
                      <p className="text-[9px] mt-0.5 font-medium leading-none text-stone-600 truncate font-sans">
                        {item.description}
                      </p>
                    </div>
                  )}
                  {/* Tooltip on Collapsed Sidebar */}
                  {isCollapsed && (
                    <div className="absolute left-16 z-50 rounded border-2 border-black bg-[#fde047] px-2 py-1 text-[10px] font-black text-black shadow-[2px_2px_0_0_#000000] opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Dynamic Brutalist Showcase Widget */}
          {!isCollapsed && showcased.length > 0 && (
            <div className="mx-3 my-2 p-3 bg-[#e0f2fe] border-2 border-black rounded-lg shadow-[2px_2px_0_0_#000000] space-y-1.5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 border-b border-black/15 pb-1">
                <Sparkles className="h-3.5 w-3.5 text-black animate-pulse" />
                <span className="font-sans font-black text-[9px] tracking-tight uppercase text-black">Vetted Daily Feature</span>
              </div>
              <div onClick={() => setView("featured")} className="cursor-pointer group">
                <h4 className="font-sans font-black text-xs text-black leading-tight truncate group-hover:underline flex items-center justify-between gap-1">
                  <span>{showcased[0].name}</span>
                  <ChevronRight className="h-3 w-3 inline stroke-[2.5px] text-stone-600 group-hover:translate-x-0.5 transition-all" />
                </h4>
                <p className="text-[9.5px] text-stone-600 font-bold leading-normal mt-0.5 line-clamp-2">
                  {showcased[0].description}
                </p>
              </div>
              <div className="flex items-center justify-between text-[8px] font-mono font-black pt-1">
                <span className="bg-[#67e8f9] text-black border border-black rounded px-1.5 py-0.5 uppercase font-black">
                  {showcased[0].type === "saas" ? "SaaS" : "Open Source"}
                </span>
                <span className="text-orange-600 flex items-center gap-0.5">
                  🔥 {showcased[0].upvotes || 0} votes
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Profile and Sessions */}
      <div className="border-t-3 border-black p-3 bg-[#fbcfe8]">
        {user ? (
          <div className="space-y-3">
            <button
              id="btn-nav-profile"
              onClick={() => setView("profile")}
              className={`w-full group relative flex items-center gap-3 rounded-lg border-2 border-black p-2 bg-white transition text-left ${
                currentView === "profile" ? "bg-[#86efac] shadow-[3px_3px_0_0_#000000] translate-x-[-1.5px] translate-y-[-1.5px]" : "hover:bg-stone-50 shadow-[1.5px_1.5px_0_0_#000000]"
              }`}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User Avatar"}
                  className="h-8 w-8 rounded border-2 border-black object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-white text-black font-black border-2 border-black text-xs">
                  {user.displayName?.charAt(0).toUpperCase() || <User className="h-3.5 w-3.5" />}
                </div>
              )}
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black text-black leading-tight">
                    {user.displayName || "User"}
                  </p>
                  <p className="truncate text-[9px] font-mono text-stone-600 font-bold leading-none mt-0.5">
                    {user.email}
                  </p>
                </div>
              )}
              {isCollapsed && (
                <div className="absolute left-16 z-50 rounded border-2 border-black bg-white px-2 py-1 text-[10px] font-black text-black shadow-[2px_2px_0_0_#000000] opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                  My Profile
                </div>
              )}
            </button>

            <button
              id="sidebar-signout"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg border-2 border-black bg-white px-2 py-1.5 text-[10px] font-black text-black hover:bg-red-500 hover:text-white hover:shadow-[3px_3px_0_0_#000000] shadow-[1.5px_1.5px_0_0_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all text-center uppercase tracking-wider"
            >
              <LogOut className="h-3.5 w-3.5 stroke-[2.5px]" />
              {!isCollapsed && <span>Log Out</span>}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {!isCollapsed && (
              <div className="rounded-lg border-2 border-black bg-white p-2 text-center shadow-[1.5px_1.5px_0_0_#000000]">
                <p className="text-[10px] font-bold leading-tight text-stone-850">
                  Connect profile to register alternative platforms and participate!
                </p>
              </div>
            )}
            <button
              id="sidebar-signin"
              onClick={onLogin}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[#fde047] border-2 border-black px-3 py-2.5 text-xs font-black text-black hover:bg-white shadow-[3px_3px_0_0_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider"
            >
              <Sparkles className="h-3.5 w-3.5 text-black animate-pulse" />
              {!isCollapsed && <span>Google Sign In</span>}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
