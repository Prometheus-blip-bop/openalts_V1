import React, { useState, useEffect } from "react";
import { 
  auth, 
  googleProvider, 
  db, 
  handleFirestoreError, 
  OperationType 
} from "./firebase";
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";
import { 
  Compass, 
  ArrowLeftRight, 
  MessageSquare, 
  Star, 
  PlusCircle, 
  User as UserIcon, 
  Sparkles, 
  Terminal, 
  Lock, 
  Unlock, 
  Key,
  Menu,
  X,
  AlertCircle,
  Bell,
  BellRing,
  Check,
  Trash,
  Info,
  Flame,
  BookOpen,
  Home
} from "lucide-react";

import Sidebar from "./components/Sidebar";
import LandingPage from "./components/LandingPage";
import DiscoverPage from "./components/DiscoverPage";
import CompareTool from "./components/CompareTool";
import CommunityPage from "./components/CommunityPage";
import SubmitProject from "./components/SubmitProject";
import ProjectDetailPage from "./components/ProjectDetailPage";
import OpenSourceMarket from "./components/OpenSourceMarket";
import OpenSourceDetailsPage from "./components/OpenSourceDetailsPage";
import TrendingPage from "./components/TrendingPage";
import BlogsPage from "./components/BlogsPage";
import PricingPage from "./components/PricingPage";
import CommunitySaaSPage from "./components/CommunitySaaSPage";
import SaaSPlanner from "./components/SaaSPlanner";
import BattlePage from "./components/BattlePage";
import MySaaSPage from "./components/MySaaSPage";
import ExplainDrawer from "./components/ExplainDrawer";
import { ViewType, Project, AppNotification } from "./types";
import { logUserInteraction } from "./utils/logger";
import { motion } from "motion/react";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit,
  setDoc,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

const MOCK_FEATURED_PROJECTS: Project[] = [
  {
    id: "mock_supabase",
    name: "Supabase",
    description: "The open source Firebase alternative. Build production-grade backends in minutes with instant PostgreSQL databasing, real-time sync, unified auth, storage, and serverless edge functions.",
    url: "https://supabase.com",
    tags: ["database", "realtime", "auth", "serverless"],
    language: "TypeScript",
    stars: 64200,
    forks: 4800,
    license: "Apache-2.0",
    type: "open-source",
    submitterId: "system",
    submitterName: "OpenAlt Core",
    rating: 4.9,
    ratingCount: 340,
    upvotes: 1845,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "mock_penpot",
    name: "Penpot",
    description: "The next-generation open-source design and prototyping platform. Created for cross-functional teams, Penpot uses open web standards (SVG, CSS Grid) to keep design and development perfectly synced.",
    url: "https://penpot.app",
    tags: ["design", "prototype", "vector", "svg"],
    language: "Clojure",
    stars: 28900,
    forks: 1400,
    license: "MPL-2.0",
    type: "open-source",
    submitterId: "system",
    submitterName: "OpenAlt Core",
    rating: 4.8,
    ratingCount: 198,
    upvotes: 1540,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "mock_appwrite",
    name: "Appwrite",
    description: "A secure, scalable backend server package for Flutter, Web, Android, iOS, and server runtimes. Includes easy authentication, complex database querying, file storage, and tasks scheduler.",
    url: "https://appwrite.io",
    tags: ["backend", "baas", "database", "auth"],
    language: "PHP",
    stars: 39500,
    forks: 3100,
    license: "BSD-3-Clause",
    type: "open-source",
    submitterId: "system",
    submitterName: "OpenAlt Core",
    rating: 4.7,
    ratingCount: 215,
    upvotes: 1210,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export default function App() {
  const [currentView, setView] = useState<ViewType>("landing");
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Custom Login state management
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Onboarding flow states
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingUsername, setOnboardingUsername] = useState("");
  const [onboardingSource, setOnboardingSource] = useState("");
  const [onboardingError, setOnboardingError] = useState("");
  const [onboardingSubmitting, setOnboardingSubmitting] = useState(false);
  
  // Curious featured projects state
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);

  // Bookmarks State Map
  const [bookmarkedProjectIds, setBookmarkedProjectIds] = useState<Record<string, boolean>>({});
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Selected Repository for Open Source deep detailed page
  const [selectedOSRepoOwner, setSelectedOSRepoOwner] = useState<string | null>(null);
  const [selectedOSRepoName, setSelectedOSRepoName] = useState<string | null>(null);

  // Explain Drawer States
  const [explainRepo, setExplainRepo] = useState<any | null>(null);
  const [isExplainDrawerOpen, setIsExplainDrawerOpen] = useState(false);

  // Active Comparison States for Open Source Marketplace
  const [compareRepoA, setCompareRepoA] = useState<any | null>(null);
  const [compareRepoB, setCompareRepoB] = useState<any | null>(null);

  // Active Toast list state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "info" | "warning" }[]>([]);

  const addToast = (message: string, type: "success" | "info" | "warning" = "info") => {
    const id = Math.random().toString(36).substring(3);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Notifications State List
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  // Load deep-linked details page on mount from query string helper
  useEffect(() => {
    async function checkDeepLink() {
      const params = new URLSearchParams(window.location.search);
      const isDetailsView = params.get("view") === "details";
      const targetProjectId = params.get("project");
      if (isDetailsView && targetProjectId) {
        try {
          const docSnap = await getDoc(doc(db, "projects", targetProjectId));
          if (docSnap.exists()) {
            const projObj = docSnap.data() as Project;
            setSelectedProject(projObj);
            setView("details");
          }
        } catch (err) {
          console.warn("Could not handle deep link query param resolution:", err);
        }
      }

      // Open Source Details deep links
      const isOSDetailsView = params.get("view") === "opensource_details";
      const targetOwner = params.get("owner");
      const targetName = params.get("name");
      if (isOSDetailsView && targetOwner && targetName) {
        setSelectedOSRepoOwner(targetOwner);
        setSelectedOSRepoName(targetName);
        setView("opensourcedetails");
      }
    }
    checkDeepLink();
  }, [db]);

  // Load bookmarks mapping when user signs in or out
  useEffect(() => {
    async function loadBookmarks() {
      if (!user) {
        setBookmarkedProjectIds({});
        return;
      }
      try {
        const qSnap = await getDocs(collection(db, `users/${user.uid}/bookmarks`));
        const bookmarksMap: Record<string, boolean> = {};
        qSnap.forEach((doc) => {
          bookmarksMap[doc.id] = true;
        });
        setBookmarkedProjectIds(bookmarksMap);
      } catch (err) {
        console.warn("Could not retrieve user bookmarks lists map:", err);
      }
    }
    loadBookmarks();
  }, [user]);

  // Live real-time stream listener for user notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const path = `users/${user.uid}/notifications`;
    const q = query(collection(db, path), orderBy("createdAt", "desc"), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: AppNotification[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as AppNotification);
      });
      setNotifications(list);
    }, (err) => {
      console.warn("Could not listen to real-time notification stream:", err);
    });
    return () => unsubscribe();
  }, [user]);

  // Actions for notifications
  async function handleMarkNotificationAsRead(notifId: string) {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/notifications`, notifId), {
        read: true
      });
    } catch (err) {
      console.warn("Could not mark notification as read:", err);
    }
  }

  async function handleDeleteNotification(notifId: string) {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/notifications`, notifId));
    } catch (err) {
      console.warn("Could not delete notification document:", err);
    }
  }

  async function handleClearAllNotifications() {
    if (!user) return;
    try {
      for (const n of notifications) {
        await deleteDoc(doc(db, `users/${user.uid}/notifications`, n.id));
      }
    } catch (err) {
      console.warn("Error clearing notifications list:", err);
    }
  }

  // Handle detailed navigation trigger
  function handleSelectProject(project: Project) {
    setSelectedProject(project);
    setView("details");
    logUserInteraction("select_project_detailed", { projectId: project.id });
  }

  // Handle bookmark trigger
  async function handleToggleBookmark(project: Project) {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    const path = `users/${user.uid}/bookmarks/${project.id}`;
    const alreadyBookmarked = !!bookmarkedProjectIds[project.id];
    
    // Optimistic UI update
    setBookmarkedProjectIds((prev) => ({
      ...prev,
      [project.id]: !alreadyBookmarked,
    }));

    try {
      if (alreadyBookmarked) {
        await deleteDoc(doc(db, `users/${user.uid}/bookmarks`, project.id));
        await logUserInteraction("remove_bookmark", { projectId: project.id });
      } else {
        await setDoc(doc(db, `users/${user.uid}/bookmarks`, project.id), {
          ...project,
          createdAt: project.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          bookmarkedAt: new Date().toISOString()
        });
        await logUserInteraction("add_bookmark", { projectId: project.id });
      }
    } catch (err) {
      setBookmarkedProjectIds((prev) => ({
        ...prev,
        [project.id]: alreadyBookmarked,
      }));
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  async function handleSelectNotification(n: AppNotification) {
    await handleMarkNotificationAsRead(n.id);
    setShowNotificationsDropdown(false);
    if (n.targetId) {
      if (n.type === "project") {
        try {
          const docSnap = await getDoc(doc(db, "projects", n.targetId));
          if (docSnap.exists()) {
            handleSelectProject(docSnap.data() as Project);
          }
        } catch (err) {
          console.warn(err);
        }
      } else {
        setView("community");
      }
    }
  }

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  // 1. Follow User Auth Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
      setUser(currUser);
      if (currUser) {
        logUserInteraction("user_sign_in_state", { email: currUser.email, isAnonymous: currUser.isAnonymous });
        setCheckingOnboarding(true);
        try {
          const userDoc = await getDoc(doc(db, "users", currUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (!data.username || !data.referralSource) {
              const cleanedName = currUser.displayName ? currUser.displayName.replace(/\s+/g, "").toLowerCase() : "";
              setOnboardingUsername(cleanedName);
              setOnboardingStep(1);
              setShowOnboarding(true);
            } else {
              setShowOnboarding(false);
            }
          } else {
            const cleanedName = currUser.displayName ? currUser.displayName.replace(/\s+/g, "").toLowerCase() : "";
            setOnboardingUsername(cleanedName);
            setOnboardingStep(1);
            addToast("Welcome! Please complete our quick onboarding setup.", "info");
            setShowOnboarding(true);
          }
        } catch (err) {
          console.warn("Could not load user's profile state on auth change:", err);
        } finally {
          setCheckingOnboarding(false);
        }
      } else {
        setShowOnboarding(false);
        setOnboardingStep(1);
        setOnboardingUsername("");
        setOnboardingSource("");
        setOnboardingError("");
      }
    });
    return () => unsubscribe();
  }, []);

  // Curated Featured Projects list running on mounts or updates
  useEffect(() => {
    async function loadFeatured() {
      setFeaturedLoading(true);
      try {
        const qSnapshot = await getDocs(
          query(collection(db, "projects"), where("rating", ">=", 4.3), limit(20))
        );
        const list: Project[] = [];
        qSnapshot.forEach((doc) => {
          list.push(doc.data() as Project);
        });
        
        // Ensure we always have our 3 premium animated mock projects at the top to satisfy user's literal prompt!
        const mergedList = [...MOCK_FEATURED_PROJECTS, ...list.filter(p => !p.id.startsWith("mock_"))];
        setFeaturedProjects(mergedList);
      } catch (err) {
        // Safe degrade fallback
        console.warn("Could not retrieve featured indices:", err);
        setFeaturedProjects(MOCK_FEATURED_PROJECTS);
      } finally {
        setFeaturedLoading(false);
      }
    }
    loadFeatured();
  }, [currentView]);

  // Auth Operations
  async function handleGoogleLogin() {
    setAuthLoading(true);
    setAuthError("");
    try {
      await signInWithPopup(auth, googleProvider);
      setShowLoginModal(false);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/popup-blocked") {
        setAuthError("Popup blocked by browser. Please enable popups or try Guest/Fast account Sign In below.");
      } else {
        setAuthError(err.message || "Sign in failed. Ensure Firebase Auth is active.");
      }
    } finally {
      setAuthLoading(false);
    }
  }

  // Failsafe Fast Login for Sandboxed Iframe Previews!
  async function handleFastDemoLogin() {
    setAuthLoading(true);
    setAuthError("");
    try {
      // Create credential anonymously and set standard display attributes
      const credential = await signInAnonymously(auth);
      await updateProfile(credential.user, {
        displayName: "OpenAlt Explorer",
        photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop"
      });
      // Force status update trigger
      setUser(auth.currentUser);
      setShowLoginModal(false);
      await logUserInteraction("sandbox_fast_login", {});
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Anonymous authorization failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleOnboardingSubmit() {
    if (!user) return;
    if (!onboardingUsername.trim()) {
      setOnboardingError("Please enter a username.");
      return;
    }
    const cleanUsername = onboardingUsername.trim().replace(/\s+/g, "").toLowerCase();
    
    if (cleanUsername.length < 2 || cleanUsername.length > 25) {
      setOnboardingError("Username must be between 2 and 25 characters.");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setOnboardingError("Username can only contain letters, numbers, and underscores.");
      return;
    }

    setOnboardingSubmitting(true);
    setOnboardingError("");

    try {
      const usersQuery = query(collection(db, "users"), where("username", "==", cleanUsername));
      const querySnap = await getDocs(usersQuery);
      let isTaken = false;
      querySnap.forEach((d) => {
        if (d.id !== user.uid) {
          isTaken = true;
        }
      });

      if (isTaken) {
        setOnboardingError(`The username "@${cleanUsername}" is already taken. Please try another!`);
        setOnboardingSubmitting(false);
        return;
      }

      setOnboardingStep(2);
    } catch (err: any) {
      console.warn("Error checking username uniqueness:", err);
      setOnboardingStep(2); // Fallback onward
    } finally {
      setOnboardingSubmitting(false);
    }
  }

  async function handleSelectReferralSource(source: string) {
    if (!user) return;
    setOnboardingSubmitting(true);
    setOnboardingError("");

    const cleanUsername = onboardingUsername.trim().replace(/\s+/g, "").toLowerCase();

    try {
      const userRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userRef);

      const profileData = {
        uid: user.uid,
        displayName: onboardingUsername.trim(),
        username: cleanUsername,
        referralSource: source,
        avatarUrl: user.photoURL || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop`,
        bio: userDocSnap.exists() ? (userDocSnap.data().bio || "") : "",
        website: userDocSnap.exists() ? (userDocSnap.data().website || "") : "",
        createdAt: userDocSnap.exists() ? (userDocSnap.data().createdAt || serverTimestamp()) : serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(userRef, profileData);

      try {
        await updateProfile(user, { displayName: onboardingUsername.trim() });
      } catch (eAuth) {
        console.warn("Could not sync display name:", eAuth);
      }

      addToast(`Onboarding complete! Welcome to OpenAlt, @${cleanUsername}!`, "success");
      setShowOnboarding(false);
    } catch (err: any) {
      console.error("Error saving onboarding details:", err);
      setOnboardingError(err.message || "Failed to complete onboarding. Check connectivity.");
    } finally {
      setOnboardingSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await logUserInteraction("user_sign_out", { email: user?.email });
      await signOut(auth);
      setView("discover");
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-[#fffdf5] neo-grid-bg font-sans text-stone-900 antialiased flex flex-col md:flex-row">
      
      {/* MOBILE HEADER BAR */}
      <header className="md:hidden bg-[#fde047] border-b-4 border-black px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-[0_4px_0_0_#000000]">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView("landing")}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white border-2 border-black">
            <Terminal className="h-4 w-4 text-[#fde047]" />
          </div>
          <span className="font-sans font-black text-lg tracking-tight text-black">
            OpenAlt
          </span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="relative border-2 border-black bg-white rounded-lg p-1.5 text-black hover:bg-stone-100 shadow-[2px_2px_0_0_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          aria-label="Toggle Mobile Menu"
        >
          {unreadNotifCount > 0 && (
            <span className="absolute -top-1 -right-1 block h-3.5 w-3.5 rounded-full bg-red-500 border-2 border-black text-[8px] font-bold text-white flex items-center justify-center animate-bounce">
              {unreadNotifCount}
            </span>
          )}
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* MOBILE NAVIGATION OVERLAY DRAWER */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 bg-black/40 backdrop-blur-sm z-40 transition-opacity">
          <div className="bg-[#fffdf5] border-b-4 border-black p-4 space-y-3 shadow-[0_4px_0_0_#000000]">
            <button
              onClick={() => { setView("landing"); setIsMobileMenuOpen(false); }}
              className={`w-full text-left font-black py-2 px-3 border-2 border-black rounded-lg text-xs flex items-center gap-2 transition-all ${
                currentView === "landing" ? "bg-[#fed7aa] text-black shadow-[3px_3px_0_0_#000000]" : "bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              <Home className="h-4 w-4" /> Home Showcase
            </button>
            <button
              onClick={() => { setView("discover"); setIsMobileMenuOpen(false); }}
              className={`w-full text-left font-black py-2 px-3 border-2 border-black rounded-lg text-xs flex items-center gap-2 transition-all ${
                currentView === "discover" ? "bg-[#fde047] text-black shadow-[3px_3px_0_0_#000000]" : "bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              <Compass className="h-4 w-4" /> Project Discovery
            </button>
            <button
              onClick={() => { setView("opensource"); setIsMobileMenuOpen(false); }}
              className={`w-full text-left font-black py-2 px-3 border-2 border-black rounded-lg text-xs flex items-center gap-2 transition-all ${
                currentView === "opensource" ? "bg-[#ddd6fe] text-black shadow-[3px_3px_0_0_#000000]" : "bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              <Terminal className="h-4 w-4" /> Open Source Market
            </button>
            <button
              onClick={() => { setView("trending"); setIsMobileMenuOpen(false); }}
              className={`w-full text-left font-black py-2 px-3 border-2 border-black rounded-lg text-xs flex items-center gap-2 transition-all ${
                currentView === "trending" ? "bg-[#fed7aa] text-black shadow-[3px_3px_0_0_#000000]" : "bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              <Flame className="h-4 w-4" /> Trending Rankings
            </button>
            <button
              onClick={() => { setView("compare"); setIsMobileMenuOpen(false); }}
              className={`w-full text-left font-black py-2 px-3 border-2 border-black rounded-lg text-xs flex items-center gap-2 transition-all ${
                currentView === "compare" ? "bg-[#67e8f9] text-black shadow-[3px_3px_0_0_#000000]" : "bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              <ArrowLeftRight className="h-4 w-4" /> AI Comparison
            </button>
            <button
              onClick={() => { setView("aiplanner"); setIsMobileMenuOpen(false); }}
              className={`w-full text-left font-black py-2 px-3 border-2 border-black rounded-lg text-xs flex items-center gap-2 transition-all ${
                currentView === "aiplanner" ? "bg-[#86efac] text-black shadow-[3px_3px_0_0_#000000]" : "bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              <Sparkles className="h-4 w-4" /> AI SaaS Planner
            </button>
            <button
              onClick={() => { setView("community"); setIsMobileMenuOpen(false); }}
              className={`w-full text-left font-black py-2 px-3 border-2 border-black rounded-lg text-xs flex items-center gap-2 transition-all ${
                currentView === "community" ? "bg-[#86efac] text-black shadow-[3px_3px_0_0_#000000]" : "bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              <MessageSquare className="h-4 w-4" /> Community Hub
            </button>
            <button
              onClick={() => { setView("blogs"); setIsMobileMenuOpen(false); }}
              className={`w-full text-left font-black py-2 px-3 border-2 border-black rounded-lg text-xs flex items-center gap-2 transition-all ${
                currentView === "blogs" ? "bg-[#67e8f9] text-black shadow-[3px_3px_0_0_#000000]" : "bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              <BookOpen className="h-4 w-4" /> Tech Blogs
            </button>
            <button
              onClick={() => { setView("featured"); setIsMobileMenuOpen(false); }}
              className={`w-full text-left font-black py-2 px-3 border-2 border-black rounded-lg text-xs flex items-center gap-2 transition-all ${
                currentView === "featured" ? "bg-[#fbcfe8] text-black shadow-[3px_3px_0_0_#000000]" : "bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              <Star className="h-4 w-4" /> Featured Projects
            </button>
            <button
              onClick={() => { setView("submit"); setIsMobileMenuOpen(false); }}
              className={`w-full text-left font-black py-2 px-3 border-2 border-black rounded-lg text-xs flex items-center gap-2 transition-all ${
                currentView === "submit" ? "bg-[#fed7aa] text-black shadow-[3px_3px_0_0_#000000]" : "bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              <PlusCircle className="h-4 w-4" /> Submit My SaaS
            </button>

            {user ? (
              <div className="pt-3 border-t-2 border-black flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setView("profile"); setIsMobileMenuOpen(false); }}>
                  <img src={user.photoURL || ""} alt="" className="h-8 w-8 rounded-full border-2 border-black" />
                  <span className="text-xs font-black text-black">{user.displayName}</span>
                </div>
                <button
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                  className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0_0_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t-2 border-black">
                <button
                  onClick={() => { setShowLoginModal(true); setIsMobileMenuOpen(false); }}
                  className="w-full text-center bg-[#fde047] py-2.5 border-2 border-black rounded-lg text-xs font-bold text-black shadow-[3px_3px_0_0_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                >
                  Sign In / Connect API
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DESKTOP COLLAPSE SIDEBAR */}
      <Sidebar
        currentView={currentView}
        setView={setView}
        user={user}
        onLogin={() => setShowLoginModal(true)}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        projects={featuredProjects}
      />

      {/* MAIN VIEW CONTENT CONTAINER */}
      <main
        className={`flex-1 min-h-screen p-4 md:p-8 transition-all duration-300 ${
          isSidebarCollapsed ? "md:ml-18" : "md:ml-64"
        }`}
      >
        <div className="max-w-6xl mx-auto">
          {/* DESKTOP LEVEL NAVIGATION HEADER BAR WITH NOTIFICATIONS BELL */}
          <div className="hidden md:flex items-center justify-between border-4 border-black bg-white p-4.5 rounded-2xl shadow-[4px_4px_0_0_#000000] mb-8 relative font-sans">
            <div>
              <span className="font-mono font-black text-[9px] uppercase tracking-wider text-slate-500 leading-none">Ecosystem Workspace Center</span>
              <h2 className="text-sm font-sans font-black text-black leading-tight flex items-center gap-1.5 mt-1">
                <Sparkles className="h-4.5 w-4.5 text-black fill-yellow-300 stroke-[2px]" />
                {user ? `Signed in: ${user.displayName || "Novice Builder"}` : "Discover strategic SaaS alternative platforms"}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                    className="relative flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-white hover:bg-stone-50 shadow-[2px_2px_0_0_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                    aria-label="Toggle alerts indicator"
                  >
                    {unreadNotifCount > 0 ? (
                      <>
                        <BellRing className="h-4.5 w-4.5 text-black animate-swing shrink-0" />
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-mono font-black text-[8px] h-5 w-5 rounded-full border-2 border-black flex items-center justify-center">
                          {unreadNotifCount}
                        </span>
                      </>
                    ) : (
                      <Bell className="h-4.5 w-4.5 text-black shrink-0 animate-none" />
                    )}
                  </button>

                  {/* Dynamic Dropdown list */}
                  {showNotificationsDropdown && (
                    <div className="absolute right-0 mt-3 w-80 bg-white border-4 border-black rounded-xl shadow-[6px_6px_0_0_#000000] z-50 p-4 space-y-4">
                      <div className="flex items-center justify-between border-b-2 border-black pb-2">
                        <span className="font-mono font-black text-[10px] text-stone-700 uppercase tracking-widest">Inbox Notifications</span>
                        {notifications.length > 0 && (
                          <button
                            onClick={handleClearAllNotifications}
                            className="text-[9px] font-mono font-black text-red-500 hover:underline uppercase"
                          >
                            Dismiss All
                          </button>
                        )}
                      </div>

                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-[11px] text-stone-500 italic font-bold">
                          Inbox clear! No new comment activity detected for your creations.
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                          {notifications.map((n) => (
                            <div 
                              key={n.id} 
                              className={`p-2.5 rounded-lg border-2 border-black shadow-[1.5px_1.5px_0_0_#000000] flex items-start justify-between gap-2.5 text-[11px] transition-all ${
                                n.read ? "bg-stone-50 text-stone-500 opacity-75" : "bg-yellow-50 text-black font-semibold"
                              }`}
                            >
                              <div 
                                onClick={() => handleSelectNotification(n)}
                                className="flex-1 cursor-pointer hover:underline"
                              >
                                <p className="leading-tight">{n.message}</p>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 shrink-0">
                                {!n.read && (
                                  <button
                                    onClick={() => handleMarkNotificationAsRead(n.id)}
                                    className="p-0.5 text-black hover:text-green-600 rounded"
                                    title="Mark as read"
                                  >
                                    <Check className="h-3.5 w-3.5 stroke-[2.5px]" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteNotification(n.id)}
                                  className="p-0.5 text-black hover:text-red-500 rounded"
                                  title="Dismiss notification"
                                >
                                  <Trash className="h-3.5 w-3.5 stroke-[2px]" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* COMPONENT CONDITIONAL RENDERING */}
          {compareRepoA && (
            <div className="bg-[#facc15] border-4 border-black p-4 rounded-2xl shadow-[4px_4px_0_0_#000000] mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans ring-2 ring-black">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black text-white border-2 border-black shadow-[1.5px_1.5px_0_0_#000000]">
                  <ArrowLeftRight className="h-5 w-5 text-[#fde047]" />
                </div>
                <div>
                  <h4 className="font-sans font-black text-xs text-black uppercase leading-tight tracking-wider">Comparison Mode Engaged</h4>
                  <p className="text-[11px] text-stone-950 font-bold mt-1">
                    Matched <span className="bg-black text-white font-mono px-1.5 py-0.5 rounded text-[10px]">{compareRepoA.owner}/{compareRepoA.name}</span>. Click Compare on another repo in the marketplace to complete the pair!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 font-mono shrink-0">
                {currentView !== "opensource" && (
                  <button
                    onClick={() => setView("opensource")}
                    className="px-2.5 py-1.5 bg-white text-black hover:bg-stone-50 border-2 border-black rounded-lg text-[10px] font-black uppercase shadow-[2px_2px_0_0_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                  >
                    Go to Market
                  </button>
                )}
                <button
                  onClick={() => {
                    setCompareRepoA(null);
                    setCompareRepoB(null);
                    addToast("Comparison stack reset.", "info");
                  }}
                  className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 border-2 border-black rounded-lg text-[10px] font-black uppercase shadow-[2px_2px_0_0_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  Clear Pair
                </button>
              </div>
            </div>
          )}

          {currentView === "landing" && (
            <LandingPage 
              setView={(v) => {
                setView(v);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onLogin={() => setShowLoginModal(true)}
              user={user}
            />
          )}

          {currentView === "discover" && (
            <DiscoverPage 
              onLogin={() => setShowLoginModal(true)} 
              setView={setView} 
              onSelectProject={handleSelectProject}
              isBookmarked={(pid) => !!bookmarkedProjectIds[pid]}
              onToggleBookmark={handleToggleBookmark}
            />
          )}

          {currentView === "opensource" && (
            <OpenSourceMarket
              onSelectRepo={(owner, name) => {
                setSelectedOSRepoOwner(owner);
                setSelectedOSRepoName(name);
                setView("opensourcedetails");
              }}
              isBookmarked={(slug) => !!bookmarkedProjectIds[slug]}
              onToggleBookmark={(repo) => {
                handleToggleBookmark({
                  id: repo.id,
                  name: repo.name,
                  description: repo.description || "",
                  url: repo.url,
                  type: "open-source",
                  tags: [repo.language || "TypeScript"],
                  language: repo.language || "TypeScript",
                  stars: repo.stars || 0,
                  forks: repo.forks || 0,
                  license: repo.license || "MIT",
                  submitterId: "github-sync",
                  submitterName: "GitHub Integration",
                  rating: 5,
                  ratingCount: 1,
                  upvotes: repo.stars || 0,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                });
              }}
              onTriggerCompare={(repo) => {
                if (!compareRepoA) {
                  setCompareRepoA(repo);
                  addToast(`Selected ${repo.owner}/${repo.name} as Tech Choice A for matching! Select another.`, "info");
                } else {
                  if (compareRepoA.id === repo.id) {
                    addToast("You cannot match a repo against itself. Select another!", "warning");
                    return;
                  }
                  setCompareRepoB(repo);
                  setView("compare");
                  addToast(`Paired up choices. Let's build the report!`, "success");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              isRepoSelectedForCompare={(slug) => {
                return compareRepoA?.id === slug || compareRepoB?.id === slug;
              }}
              onExplainRepo={(repo) => {
                if (!user) {
                  addToast("Please connect your builder token or sign in to ask our AI to explain repositories! ⚔️", "warning");
                  setShowLoginModal(true);
                  return;
                }
                setExplainRepo(repo);
                setIsExplainDrawerOpen(true);
              }}
            />
          )}

          {currentView === "opensourcedetails" && selectedOSRepoOwner && selectedOSRepoName && (
            <OpenSourceDetailsPage
              owner={selectedOSRepoOwner}
              name={selectedOSRepoName}
              onBack={() => setView("opensource")}
              isBookmarked={!!bookmarkedProjectIds[`${selectedOSRepoOwner}/${selectedOSRepoName}`]}
              onToggleBookmark={(repo) => {
                handleToggleBookmark({
                  id: `${selectedOSRepoOwner}/${selectedOSRepoName}`,
                  name: selectedOSRepoName,
                  description: repo.description || "",
                  url: repo.html_url,
                  type: "open-source",
                  tags: [repo.language || "TypeScript"],
                  language: repo.language || "TypeScript",
                  stars: repo.stargazers_count || 0,
                  forks: repo.forks_count || 0,
                  license: repo.license?.spdx_id || "MIT",
                  submitterId: "github-sync",
                  submitterName: "GitHub Integration",
                  rating: 5,
                  ratingCount: 1,
                  upvotes: repo.stargazers_count || 0,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                });
              }}
            />
          )}

          {currentView === "details" && selectedProject && (
            <ProjectDetailPage
              project={selectedProject}
              onBack={() => setView("discover")}
              onLogin={() => setShowLoginModal(true)}
              isBookmarked={!!bookmarkedProjectIds[selectedProject.id]}
              onToggleBookmark={handleToggleBookmark}
            />
          )}

          {currentView === "compare" && (
            <CompareTool 
              repoAObj={compareRepoA}
              repoBObj={compareRepoB}
              onClear={() => {
                setCompareRepoA(null);
                setCompareRepoB(null);
              }}
              setView={setView}
              onLogin={() => setShowLoginModal(true)}
            />
          )}

          {currentView === "community" && (
            <CommunityPage 
              onLogin={() => setShowLoginModal(true)} 
              onSelectProject={handleSelectProject}
            />
          )}

          {currentView === "trending" && (
            <TrendingPage
              onSelectProject={handleSelectProject}
              isBookmarked={(pid) => !!bookmarkedProjectIds[pid]}
              onToggleBookmark={handleToggleBookmark}
              addToast={addToast}
              featuredProjects={featuredProjects}
              featuredLoading={featuredLoading}
            />
          )}

          {currentView === "blogs" && (
            <BlogsPage />
          )}

          {currentView === "submit" && (
            <SubmitProject onLogin={() => setShowLoginModal(true)} setView={setView} />
          )}

          {currentView === "profile" && (
            <CommunityPage 
              onLogin={() => setShowLoginModal(true)} 
              onSelectProject={handleSelectProject}
              addToast={addToast}
            />
          )}

          {currentView === "pricing" && (
            <PricingPage 
              onLogin={() => setShowLoginModal(true)} 
              addToast={addToast}
            />
          )}

          {currentView === "communitysaas" && (
            <CommunitySaaSPage 
              setView={setView}
              onSelectProject={handleSelectProject}
              isBookmarked={(pid) => !!bookmarkedProjectIds[pid]}
              onToggleBookmark={handleToggleBookmark}
              addToast={addToast}
            />
          )}

          {currentView === "aiplanner" && (
            <SaaSPlanner />
          )}

          {currentView === "mysaas" && (
            <MySaaSPage 
              onLogin={() => setShowLoginModal(true)}
              setView={setView}
              addToast={addToast}
            />
          )}

          {currentView === "battle" && (
            <BattlePage 
              onLogin={() => setShowLoginModal(true)}
              addToast={addToast}
            />
          )}
        </div>
      </main>

      <ExplainDrawer 
        isOpen={isExplainDrawerOpen} 
        onClose={() => {
          setIsExplainDrawerOpen(false);
          setExplainRepo(null);
        }} 
        repo={explainRepo} 
      />

      {/* FULL-SCREEN SECURE LOGIN MODAL */}
      {showLoginModal && (
        <div id="login-modal-overlay" className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#fffdf5] rounded-2xl p-6 md:p-8 max-w-sm w-full border-4 border-black shadow-[8px_8px_0_0_#000000] relative space-y-6">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 rounded-lg p-1.5 border-2 border-black bg-white text-black hover:bg-stone-100 shadow-[2px_2px_0_0_#000000] transition-all"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-black border-2 border-black text-[#fde047] shadow-[3px_3px_0_0_#000000]">
                <Terminal className="h-6 w-6 text-[#fde047]" />
              </div>
              <h2 className="text-2xl font-black text-black tracking-tight mt-3">
                OPENALT COLLECTIVE
              </h2>
              <p className="text-xs px-2 text-stone-700 leading-relaxed font-medium">
                Connect your builder workspace to register SaaS platforms, participate in forums, and rate alternative software.
              </p>
            </div>

            {authError && (
              <div className="flex items-start gap-2 text-xs text-red-700 bg-red-100 p-3.5 border-2 border-black rounded-lg font-bold">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span className="leading-relaxed">{authError}</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              {/* Native Google auth button */}
              <button
                id="btn-google-oath"
                onClick={handleGoogleLogin}
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-3 rounded-lg border-2 border-black bg-white px-4 py-3 text-xs font-extrabold text-black hover:bg-stone-50 transition active:translate-x-0.5 active:translate-y-0.5 shadow-[3px_3px_0_0_#000000] active:shadow-none"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Google Sign-In</span>
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t-2 border-black"></div>
                <span className="flex-shrink mx-3 text-[9px] font-bold text-stone-600 uppercase tracking-widest font-mono">SANDBOX FAILS-SAFE</span>
                <div className="flex-grow border-t-2 border-black"></div>
              </div>

              {/* Sandbox fast auth access failsafe */}
              <button
                id="btn-fast-signin"
                onClick={handleFastDemoLogin}
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-black border-2 border-black hover:bg-[#fde047] hover:text-black text-white px-4 py-3 text-xs font-black transition-all shadow-[4px_4px_0_0_#fde047] active:translate-x-0.5 active:translate-y-0.5"
              >
                <Key className="h-4 w-4 text-[#fde047] animate-bounce" />
                <span>Instantly Sign In as Guest</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERSISTENT FULL-SCREEN ONBOARDING POPUP */}
      {showOnboarding && (
        <div id="onboarding-overlay" className="fixed inset-0 bg-[#fffdf5]/95 neo-grid-bg z-[999] flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-[8px_8px_0_0_#000000] space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#fde047] border-4 border-black text-black shadow-[4px_4px_0_0_#000000]">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-black text-black tracking-tight pt-2">
                {onboardingStep === 1 ? "CLAIM YOUR USERNAME" : "ONE LAST QUESTION"}
              </h2>
              <p className="text-xs text-stone-600 font-bold uppercase tracking-wider font-mono">
                Step {onboardingStep} of 2 &bull; Setup Profile
              </p>
            </div>

            {/* Error Message */}
            {onboardingError && (
              <div className="flex items-start gap-2.5 text-xs text-red-700 bg-red-100 p-4 border-2 border-black rounded-xl font-bold">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span className="leading-relaxed">{onboardingError}</span>
              </div>
            )}

            {/* STEP 1: Set Username */}
            {onboardingStep === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-stone-700 leading-relaxed font-semibold text-center">
                  Set up your unique platform name. This will be your permanent profile identity across OpenAlt's reviews, comments, and dashboards.
                </p>

                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-black">
                    Your Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-black text-lg">@</span>
                    <input
                      type="text"
                      value={onboardingUsername}
                      onChange={(e) => {
                        setOnboardingUsername(e.target.value.replace(/\s+/g, "").toLowerCase());
                        setOnboardingError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleOnboardingSubmit();
                        }
                      }}
                      placeholder="saas_builder"
                      disabled={onboardingSubmitting}
                      className="w-full pl-9 pr-4 py-3.5 border-4 border-black font-black text-lg rounded-xl bg-white shadow-[3px_3px_0_0_#000000] focus:outline-none focus:ring-4 focus:ring-yellow-300 disabled:opacity-70 transition-all placeholder:text-stone-300"
                    />
                  </div>
                  <span className="text-[10px] text-stone-500 font-mono font-bold block pt-1">
                    Rule: 2-25 characters &bull; lowercase letters, numbers, and underscores only
                  </span>
                </div>

                <button
                  onClick={handleOnboardingSubmit}
                  disabled={onboardingSubmitting || !onboardingUsername.trim()}
                  className="w-full bg-[#fde047] text-black font-extrabold uppercase tracking-widest text-xs border-4 border-black py-4 px-6 rounded-xl shadow-[4px_4px_0_0_#000000] active:translate-y-1 active:shadow-[1px_1px_0_0_#000000] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000000] disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_#000000] transition-all flex items-center justify-center gap-2"
                >
                  {onboardingSubmitting ? (
                    <span>Checking availability...</span>
                  ) : (
                    <>
                      <span>Continue to Next Step</span>
                      <span>➜</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* STEP 2: Marketing Attribution */}
            {onboardingStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-stone-700 leading-relaxed font-semibold text-center">
                  Where did you hear about OpenAlt? Help us understand where real builders hang out!
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {[
                    { name: "Instagram", color: "bg-[#fbcfe8]", hover: "hover:bg-[#f472b6]" },
                    { name: "LinkedIn", color: "bg-[#e0f2fe]", hover: "hover:bg-[#7dd3fc]" },
                    { name: "X / Twitter", color: "bg-[#f1f5f9]", hover: "hover:bg-[#cbd5e1]" },
                    { name: "Reddit", color: "bg-[#ffedd5]", hover: "hover:bg-[#fdba74]" },
                    { name: "Telegram", color: "bg-[#e0f2fe]", hover: "hover:bg-[#38bdf8]" },
                    { name: "Discord", color: "bg-[#ddd6fe]", hover: "hover:bg-[#a78bfa]" },
                    { name: "Search Engine", color: "bg-[#fef08a]", hover: "hover:bg-[#facc15]" },
                    { name: "Other Channel", color: "bg-[#f3f4f6]", hover: "hover:bg-[#e5e7eb]" }
                  ].map((sourceOpt) => (
                    <button
                      key={sourceOpt.name}
                      onClick={() => handleSelectReferralSource(sourceOpt.name)}
                      disabled={onboardingSubmitting}
                      className={`font-black text-center text-xs p-3.5 border-4 border-black rounded-xl shadow-[3px_3px_0_0_#000000] active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000000] hover:-translate-y-0.5 transition-all text-black ${sourceOpt.color} ${sourceOpt.hover} disabled:opacity-50`}
                    >
                      <span>{sourceOpt.name}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex justify-between items-center text-xs">
                  <button
                    onClick={() => setOnboardingStep(1)}
                    disabled={onboardingSubmitting}
                    className="text-stone-500 hover:text-black font-extrabold underline decoration-2 underline-offset-4 disabled:opacity-50 transition-all"
                  >
                    &larr; Back to Username
                  </button>
                  <span className="font-mono text-stone-400 font-bold">@{(onboardingUsername || "").toLowerCase()}</span>
                </div>
              </div>
            )}
            
            {/* Safe Logout Escape Hatch */}
            <div className="pt-2 text-center border-t-2 border-stone-100">
              <button 
                onClick={handleLogout}
                className="text-xs text-red-600 hover:text-red-700 font-extrabold underline decoration-2 underline-offset-4"
              >
                Sign out / cancel onboarding
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Brutalist Toast Notifications Panel Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 font-sans w-80 pointer-events-none">
        {toasts.map((t) => {
          const bgClass = 
            t.type === "success" ? "bg-[#86efac]" : 
            t.type === "warning" ? "bg-[#fbcfe8]" : 
            "bg-[#67e8f9]";
          return (
            <div
              key={t.id}
              className={`p-4 border-4 border-black rounded-xl shadow-[4px_4px_0_0_#000000] text-black text-xs font-black flex items-start gap-2.5 transition-all pointer-events-auto ${bgClass}`}
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white border-2 border-black text-xs font-bold font-mono">
                &raquo;
              </div>
              <div className="flex-1 leading-relaxed">{t.message}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
