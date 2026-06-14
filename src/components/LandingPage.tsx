import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Terminal, 
  Compass, 
  ArrowLeftRight, 
  MessageSquare, 
  Flame, 
  BookOpen, 
  PlusCircle, 
  ChevronRight,
  Zap,
  ArrowRight,
  Sun,
  Moon,
  Github,
  Award,
  Users,
  Grid,
  TrendingUp,
  Cpu,
  Heart
} from "lucide-react";
import { ViewType } from "../types";

interface LandingPageProps {
  setView: (view: ViewType) => void;
  onLogin: () => void;
  user: any;
}

// Sparkle emitter structure for clicked upvotes
interface FloatingSpark {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

export default function LandingPage({ setView, onLogin, user }: LandingPageProps) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [currentPairIndex, setCurrentPairIndex] = useState<number>(0);
  const [likesCount, setLikesCount] = useState<number>(1824);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [sparks, setSparks] = useState<FloatingSpark[]>([]);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  // Common open-source vs proprietary comparison pairs for the interactive sandbox
  const COMPARISON_PAIRS = [
    {
      title: "Supabase vs Firebase",
      openSource: "Supabase",
      osDesc: "Relational SQL database, real-time sync, unified auth, 100% self-hostable.",
      osRating: 9.3,
      osStars: 64200,
      proprietary: "Firebase",
      propDesc: "Document-centric NoSQL storage, closed source ecosystem, vendor locked tiering.",
      propRating: 8.6,
      tags: ["Relational Database", "Auth Sync", "Serverless Edge"],
      verdict: "Supabase provides rigorous relational security via PostgreSQL, while Firebase remains highly effective for simpler schema-less storage documents."
    },
    {
      title: "Penpot vs Figma",
      openSource: "Penpot",
      osDesc: "Standards-based SVG native editor, flexbox & CSS grid embedded layouts, fully sovereign.",
      osRating: 8.9,
      osStars: 28900,
      proprietary: "Figma",
      propDesc: "Enterprise design workspace with a rich plugin store but closed source canvas code.",
      propRating: 9.4,
      tags: ["SVG Native", "CSS Grid Layouts", "Zero Vendor Lock-in"],
      verdict: "Figma maintains the industry-wide plugin network, but Penpot excels for developers demanding self-hosted vector freedom and strict source web layouts."
    },
    {
      title: "Cal.com vs Calendly",
      openSource: "Cal.com",
      osDesc: "Extremely modular calendars, programmatic API access, HIPAA GDPR compliance.",
      osRating: 9.5,
      osStars: 32100,
      proprietary: "Calendly",
      propDesc: "Classic sales workflow scheduler but strictly premium feature restrictions.",
      propRating: 8.5,
      tags: ["Developer First", "Sovereign Booking", "Enterprise APIs"],
      verdict: "Cal.com reigns supreme due to its native web styling controls, complete API integrations, and robust self-hosting layouts."
    }
  ];

  // Colors based on neumorphic mode
  const bgMain = isDarkMode ? "bg-[#1b1f27]" : "bg-[#f0f4f8]";
  const textPrimary = isDarkMode ? "text-stone-150" : "text-slate-800";
  const textSecondary = isDarkMode ? "text-stone-400" : "text-stone-600";
  
  // Custom box shadow configurations
  const neuOutset = isDarkMode 
    ? { boxShadow: "9px 9px 18px #0f1116, -9px -9px 18px #272d38" }
    : { boxShadow: "9px 9px 18px #d4dde6, -9px -9px 18px #ffffff" };

  const neuInset = isDarkMode
    ? { boxShadow: "inset 5px 5px 10px #0f1116, inset -5px -5px 10px #272d38" }
    : { boxShadow: "inset 5px 5px 10px #d4dde6, inset -5px -5px 10px #ffffff" };

  const neuButtonSoft = isDarkMode
    ? { boxShadow: "6px 6px 12px #0f1116, -6px -6px 12px #272d38" }
    : { boxShadow: "6px 6px 12px #d4dde6, -6px -6px 12px #ffffff" };

  const neuHeroShield = isDarkMode
    ? { boxShadow: "15px 15px 30px #0c0e12, -15px -15px 30px #2a303c" }
    : { boxShadow: "15px 15px 30px #cbd4de, -15px -15px 30px #ffffff" };

  // Trigger floating sparkle emission on Upvote click
  const triggerUpvoteSpark = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const emojis = ["🔥", "✨", "💚", "👑", "🚀", "💥"];
    const newSparks = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x: clickX,
      y: clickY,
      emoji: emojis[Math.floor(Math.random() * emojis.length)]
    }));

    setSparks((prev) => [...prev, ...newSparks]);
    if (!hasLiked) {
      setLikesCount(prev => prev + 1);
      setHasLiked(true);
    } else {
      setLikesCount(prev => prev - 1);
      setHasLiked(false);
    }

    // Clean sparks lists
    setTimeout(() => {
      setSparks((prev) => prev.filter((s) => !newSparks.some((ns) => ns.id === s.id)));
    }, 1200);
  };

  const featureCards = [
    {
      title: "Discovery Deck",
      description: "Search and filter thousands of independent tools and open-source applications mapped to popular commercial giants.",
      icon: Compass,
      view: "discover" as ViewType,
      color: "bg-amber-400"
    },
    {
      title: "AI Compare Router",
      description: "Leverage real-time web search grounding comparisons to stack pros, cons, ratings, and code licenses together.",
      icon: ArrowLeftRight,
      view: "compare" as ViewType,
      color: "bg-cyan-400"
    },
    {
      title: "Developers Hub",
      description: "Join alternative community forums to voice upvotes, submit SaaS feedback, or rate codebase sovereignty.",
      icon: MessageSquare,
      view: "community" as ViewType,
      color: "bg-rose-400"
    }
  ];

  return (
    <div className={`w-full min-h-screen ${bgMain} transition-all duration-500 rounded-3xl p-4 md:p-8 flex flex-col font-sans relative overflow-hidden select-none`}>
      
      {/* Dynamic drifting ambient shapes in the background with React Motion */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          animate={{ 
            y: [0, -35, 0],
            x: [0, 20, 0]
          }}
          transition={{ 
            duration: 12, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className={`absolute h-72 w-72 rounded-full blur-3xl opacity-30 ${isDarkMode ? "bg-cyan-900" : "bg-cyan-200"}`}
          style={{ top: "15%", left: "10%" }}
        />
        <motion.div 
          animate={{ 
            y: [0, 45, 0],
            x: [0, -25, 0]
          }}
          transition={{ 
            duration: 18, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className={`absolute h-96 w-96 rounded-full blur-3xl opacity-25 ${isDarkMode ? "bg-amber-950" : "bg-amber-100"}`}
          style={{ right: "5%", bottom: "20%" }}
        />
      </div>

      {/* Floating Interactive 3D Tech Bubbles drifting across the visual stage */}
      <div className="absolute inset-0 pointer-events-none z-0 scrollbar-none">
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: "25%", right: "12%" }}
          className={`absolute hidden lg:flex items-center gap-2 p-3.5 rounded-2xl ${textPrimary}`}
        >
          <div className="flex h-3 w-3 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] uppercase font-mono font-black tracking-widest bg-stone-900/10 dark:bg-white/10 px-2 py-0.5 rounded-lg">Postgres Native</span>
        </motion.div>

        <motion.div 
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          style={{ bottom: "35%", left: "8%" }}
          className={`absolute hidden lg:flex items-center gap-2 p-3.5 rounded-2xl ${textPrimary}`}
        >
          <div className="flex h-3 w-3 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[10px] uppercase font-mono font-black tracking-widest bg-stone-900/10 dark:bg-white/10 px-2 py-0.5 rounded-lg">Sovereign Autonomy</span>
        </motion.div>
      </div>

      {/* Landing Custom Header Control Bar */}
      <div className="flex items-center justify-between w-full h-14 border-b border-stone-300/30 dark:border-stone-700/30 z-10 px-2">
        <div className="flex items-center gap-2.5">
          <motion.div
            whileHover={{ rotate: 18 }}
            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-300 to-amber-400 border border-amber-300 shadow-md`}
          >
            <Terminal className="h-5 w-5 text-black shrink-0" />
          </motion.div>
          <div>
            <span className={`font-sans font-black text-base md:text-lg tracking-tight ${isDarkMode ? "text-stone-100" : "text-stone-900"} flex items-center gap-1.5`}>
              OpenAlt
              <span className="text-[8px] font-mono py-0.5 px-1.5 rounded-full border border-orange-500 bg-orange-500/10 text-orange-500 font-extrabold uppercase tracking-wide">
                Neumorphic Edition
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Neumorphic theme switcher */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            style={neuButtonSoft}
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-3 rounded-xl border border-white/40 dark:border-stone-800 flex items-center justify-center cursor-pointer transition-all ${
              isDarkMode ? "bg-stone-800 text-yellow-400" : "bg-[#f0f4f8] text-indigo-700"
            }`}
            title="Toggle Neumorphic Theme"
          >
            {isDarkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </motion.button>

          {/* Connect App directly entry trigger */}
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setView("discover")}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-400 bg-amber-400 hover:bg-amber-500 text-black font-sans font-black text-xs shadow-lg shadow-amber-400/25 transition-all cursor-pointer"
          >
            <span>Enter Studio App</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </div>

      {/* HERO SECTION CONTAINER - 3D Neumorphic Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-10 md:py-16 z-10 w-full flex-1">
        
        {/* Left Column Description */}
        <div className="lg:col-span-7 space-y-6 text-left flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`inline-flex items-center gap-2 p-2.5 px-4 rounded-full border border-white/50 dark:border-stone-800 bg-transparent text-xs font-mono font-black tracking-wide ${isDarkMode ? "text-cyan-400" : "text-cyan-600"}`}
            style={neuInset}
          >
            <Sparkles className="h-4 w-4 text-cyan-400 fill-cyan-400" />
            <span>100% UNBIASED OPEN SOURCE SAAS DICTIONARY</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] ${isDarkMode ? "text-stone-100" : "text-stone-900"}`}
          >
            The Beautiful, Sovereign Alternative to <span className="text-amber-500 underline decoration-wavy decoration-orange-500/55 decoration-4">SaaS Monopoly</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`text-sm md:text-base leading-relaxed font-medium ${textSecondary} max-w-xl`}
          >
            OpenAlt is an interactive visual database index pairing popular high-cost multi-tenant SaaS tools with their pristine open-source developer-sovereign equivalents. Powered by AI search grounding with self-hosting schemas.
          </motion.p>

          {/* Interactive Button Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4.5 pt-2"
          >
            <motion.button
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView("discover")}
              className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-500 border border-amber-300 text-black font-sans font-black text-sm flex items-center gap-2 shadow-xl shadow-amber-400/25 cursor-pointer"
            >
              <Compass className="h-4.5 w-4.5" />
              <span>Launch Discovery Deck</span>
            </motion.button>

            <motion.button
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView("compare")}
              className={`px-6 py-3.5 rounded-2xl bg-[#e6ebf2] dark:bg-stone-850 border border-white/50 dark:border-stone-800 ${isDarkMode ? "text-stone-100" : "text-stone-800"} font-sans font-black text-sm flex items-center gap-2 cursor-pointer`}
              style={neuButtonSoft}
            >
              <ArrowLeftRight className="h-4.5 w-4.5 text-cyan-400" />
              <span>AI Comparative Grounder</span>
            </motion.button>
          </motion.div>

          {/* Real-time stats ticker in neumorphic pods */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-3 gap-4.5 pt-6 max-w-lg"
          >
            {[
              { label: "Sovereign Repos", value: "+1,420" },
              { label: "Community Forum", value: "Active" },
              { label: "Search Grids Tested", value: "99.8%" }
            ].map((stat, idx) => (
              <div 
                key={idx}
                className="p-3.5 py-4 rounded-2xl text-center border border-white/20 dark:border-stone-800"
                style={neuInset}
              >
                <div className={`text-lg font-mono font-black ${isDarkMode ? "text-amber-400" : "text-stone-850"}`}>{stat.value}</div>
                <div className={`text-[10px] font-mono tracking-widest font-bold uppercase mt-1 ${textSecondary}`}>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right Column: Hero Neumorphic Core Shield and Interactive Sandbox */}
        <div className="lg:col-span-12 xl:col-span-5 flex justify-center items-center z-10 pt-5 lg:pt-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
            className={`w-full max-w-md p-6 rounded-[2.5rem] border border-white/50 dark:border-stone-800 transition-all ${
              isDarkMode ? "bg-stone-850" : "bg-[#f4f7fa]"
            }`}
            style={neuHeroShield}
          >
            {/* Shield Header */}
            <div className="flex items-center justify-between border-b border-stone-300/30 dark:border-stone-700/30 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
                <span className={`text-[11px] font-mono font-black uppercase tracking-wider ${textSecondary}`}>
                  Active Playground Sandbox
                </span>
              </div>
              <span className={`text-[10px] font-mono font-bold bg-[#86efac]/10 text-green-500 border border-green-500/20 px-2 py-0.5 rounded-full`}>
                Grounded OK
              </span>
            </div>

            {/* Sparkle Emitter Surface */}
            <div className="relative p-5 rounded-3xl border border-white/40 dark:border-stone-800/40 mb-5 overflow-hidden" style={neuInset}>
              
              {/* Spawning sparkle particle container */}
              <AnimatePresence>
                {sparks.map((spark) => (
                  <motion.span
                    key={spark.id}
                    initial={{ opacity: 1, scale: 0.8, x: spark.x, y: spark.y }}
                    animate={{ 
                      y: spark.y - 110, 
                      x: spark.x + (Math.random() * 80 - 40),
                      opacity: 0, 
                      scale: 1.4,
                      rotate: Math.random() * 180 - 90 
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                    className="absolute text-lg select-none pointer-events-none z-50 text-shadow-md"
                  >
                    {spark.emoji}
                  </motion.span>
                ))}
              </AnimatePresence>

              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-[9px] font-mono tracking-widest font-black uppercase ${textSecondary}`}>Community Endorsement</span>
                  <div className={`text-4xl font-mono font-black mt-1 ${isDarkMode ? "text-stone-100" : "text-black"}`}>
                    {likesCount.toLocaleString()} <span className="text-xl">🔥</span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={triggerUpvoteSpark}
                  className={`p-4 rounded-full border border-[#fbcfe8] dark:border-stone-800 ${
                    hasLiked ? "bg-rose-500 text-white" : "bg-rose-50 dark:bg-stone-900 text-rose-500"
                  } shadow-md flex items-center justify-center cursor-pointer transition-colors relative`}
                  aria-label="Upvote OpenAlt"
                >
                  <Heart className={`h-6.5 w-6.5 ${hasLiked ? "fill-white stroke-white" : "fill-none animate-pulse"}`} />
                </motion.button>
              </div>

              <p className={`text-xs mt-3 select-none leading-relaxed font-medium ${textSecondary}`}>
                {hasLiked 
                  ? "Thanks for endorsing sovereign software! Click again to retract." 
                  : "Click the dynamic accelerator heart above to upvote OpenAlt and inject visual sparks into the dashboard!"
                }
              </p>
            </div>

            {/* Quick Micro Sandbox Segment */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <span className={`text-[10px] font-mono tracking-widest font-black uppercase ${textSecondary}`}>SaaS Target Matching</span>
                <span className="text-[10px] font-mono font-bold text-cyan-400">Pair #{currentPairIndex + 1}</span>
              </div>

              {/* Selector Tabs for Comparison Sandboxes */}
              <div className="grid grid-cols-3 gap-2 p-1.5 rounded-xl border border-white/40 dark:border-stone-800/40" style={neuInset}>
                {COMPARISON_PAIRS.map((pair, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPairIndex(index)}
                    className={`text-[9px] font-black font-mono py-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                      currentPairIndex === index 
                        ? "bg-amber-400 border-amber-300 text-black shadow-inner" 
                        : "bg-transparent border-transparent text-stone-500 hover:text-stone-700"
                    }`}
                  >
                    Tab {index + 1}
                  </button>
                ))}
              </div>

              {/* Interactive Slide Comparison Matrix */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPairIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4.5 p-4 rounded-2xl bg-[#eff3f8] dark:bg-stone-900 border border-white/35 dark:border-stone-800/35"
                  style={neuButtonSoft}
                >
                  <div className="text-center font-black text-xs uppercase tracking-wider text-amber-500">
                    {COMPARISON_PAIRS[currentPairIndex].title}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pb-2 border-b border-stone-200 dark:border-stone-800">
                    {/* Open Source Match */}
                    <div className="space-y-1 text-left border-r border-stone-300/30 pr-2">
                      <div className={`text-[11px] font-mono font-extrabold flex items-center gap-1 ${isDarkMode ? "text-stone-100" : "text-black"}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        {COMPARISON_PAIRS[currentPairIndex].openSource}
                      </div>
                      <p className="text-[9px] text-stone-500 leading-normal font-medium max-h-12 overflow-hidden">
                        {COMPARISON_PAIRS[currentPairIndex].osDesc}
                      </p>
                      <div className="py-1">
                        <span className="text-[10px] font-mono font-black text-green-500">★ {COMPARISON_PAIRS[currentPairIndex].osRating} / 10</span>
                      </div>
                    </div>

                    {/* Proprietary Match */}
                    <div className="space-y-1 text-left pl-1">
                      <div className={`text-[11px] font-mono font-extrabold flex items-center gap-1 ${isDarkMode ? "text-stone-100" : "text-black"}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                        {COMPARISON_PAIRS[currentPairIndex].proprietary}
                      </div>
                      <p className="text-[9px] text-stone-500 leading-normal font-medium max-h-12 overflow-hidden">
                        {COMPARISON_PAIRS[currentPairIndex].propDesc}
                      </p>
                      <div className="py-1">
                        <span className="text-[10px] font-mono font-black text-stone-600 dark:text-stone-400">★ {COMPARISON_PAIRS[currentPairIndex].propRating} / 10</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left space-y-1">
                    <span className={`text-[8px] font-mono tracking-widest font-black uppercase ${textSecondary}`}>AI Synthesizer Focus</span>
                    <p className="text-[10px] text-stone-600 dark:text-stone-400 italic leading-relaxed">
                      "{COMPARISON_PAIRS[currentPairIndex].verdict}"
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

      </div>

      {/* CORE FUNCTIONALITIES - THREE NEUMORPHIC SLIDES - Animated Stagger list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 md:py-10 z-10 w-full">
        {featureCards.map((feat, index) => {
          const Icon = feat.icon;
          const isHovered = hoveredFeature === index;
          return (
            <motion.div
              key={index}
              onHoverStart={() => setHoveredFeature(index)}
              onHoverEnd={() => setHoveredFeature(null)}
              whileHover={{ y: -8 }}
              onClick={() => setView(feat.view)}
              style={isHovered ? neuInset : neuButtonSoft}
              className={`p-6 rounded-[2rem] border border-white/50 dark:border-stone-850 cursor-pointer text-left transition-all relative overflow-hidden`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-4.5 rounded-2xl ${
                  isDarkMode ? "bg-stone-800 text-amber-400" : "bg-white text-stone-900 shadow-sm"
                } border border-white/40 dark:border-stone-750 flex items-center justify-center`}>
                  <Icon className="h-6 w-6 stroke-[2px]" />
                </div>
                <div className="flex h-7 w-7 rounded-full bg-stone-900/5 dark:bg-white/5 items-center justify-center">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>

              <h3 className={`text-lg font-black ${isDarkMode ? "text-stone-100" : "text-stone-900"} tracking-tight mb-2 flex items-center gap-2`}>
                {feat.title}
                {isHovered && <span className="h-2 w-2 rounded-full bg-amber-500" />}
              </h3>
              
              <p className={`text-xs font-medium leading-relaxed ${textSecondary}`}>
                {feat.description}
              </p>

              {/* Slide animation indicators */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </motion.div>
          );
        })}
      </div>

      {/* THREE INTERACTIVE SAAS CATEGORIES SLIDER ROWS */}
      <div className="py-10 md:py-14 border-t border-stone-300/20 dark:border-stone-700/20 z-10 w-full text-left">
        <h2 className={`text-2xl md:text-3xl font-black ${isDarkMode ? "text-stone-100" : "text-stone-900"} tracking-tight mb-3`}>
          Ecosystem Alternative Matrice
        </h2>
        
        <p className={`text-xs md:text-sm ${textSecondary} max-w-xl mb-8 font-medium`}>
          Review modern multi-industry domains built inside OpenAlt. Fast-track setup directly with GitHub repositories list and live ratings.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { tag: "DATABASE BAAS", size: "64.2k stars", alt: "Supabase vs Firebase", path: "opensource", item: "Supabase" },
            { tag: "SCHEDULING MODULE", size: "32.1k stars", alt: "Cal.com vs Calendly", path: "trending", item: "Cal.com" },
            { tag: "DESIGN SYSTEM", size: "28.9k stars", alt: "Penpot vs Figma", path: "communitysaas", item: "Penpot" },
            { tag: "FORM SYNC ENGINE", size: "12.8k stars", alt: "Formbricks vs Typeform", path: "discover", item: "Formbricks" }
          ].map((cat, idx) => (
            <motion.div
              whileHover={{ scale: 1.02 }}
              key={idx}
              className="p-5 rounded-2xl border border-white/40 dark:border-stone-850"
              style={neuButtonSoft}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-mono font-black text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full uppercase tracking-widest leading-none border border-amber-500/20">
                  {cat.tag}
                </span>
                <span className={`text-[9px] font-mono ${textSecondary}`}>
                  {cat.size}
                </span>
              </div>

              <h4 className={`text-sm font-black ${isDarkMode ? "text-stone-200" : "text-black"}`}>
                {cat.item}
              </h4>
              
              <p className={`text-[11px] font-medium ${textSecondary} mt-1 mb-4`}>
                Top open alternate to {cat.alt.split(" vs ")[1]}
              </p>

              <button
                onClick={() => setView(cat.path as ViewType)}
                className={`w-full py-2 bg-transparent text-stone-600 dark:text-stone-300 border border-stone-300 dark:border-stone-700 hover:border-amber-400 dark:hover:border-amber-400 hover:text-amber-500 text-[10px] font-mono uppercase font-black tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1`}
              >
                <span>Navigate Segment</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FOOTER CALL TO ACTION - Neumorphic Pod */}
      <div className="mt-auto py-8 border-t border-stone-300/20 dark:border-stone-700/20 z-10 w-full flex flex-col md:flex-row items-center justify-between gap-6 whitespace-nowrap">
        
        <div className="text-center md:text-left">
          <span className={`text-[9px] font-mono tracking-widest font-black uppercase ${textSecondary}`}>
            Open-Architecture Initiative
          </span>
          <p className={`text-xs font-semibold ${isDarkMode ? "text-stone-300" : "text-stone-700"} mt-0.5`}>
            Empowering tech organizations to recover full data sovereignty.
          </p>
        </div>

        <div className="flex items-center gap-4.5">
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLogin}
            className={`px-5 py-2.5 rounded-xl border border-white/50 dark:border-stone-800 ${isDarkMode ? "bg-stone-800 text-stone-100" : "bg-white text-stone-800"} font-mono font-black text-xs cursor-pointer`}
            style={neuButtonSoft}
          >
            {user ? "Signed In" : "Connect Developer API"}
          </motion.button>

          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView("discover")}
            className="px-5 py-2.5 rounded-xl bg-black dark:bg-amber-400 border border-black dark:border-amber-300 text-white dark:text-black font-sans font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-1"
          >
            <span>Dive Into Studio</span>
            <ArrowRight className="h-3 w-3" />
          </motion.button>
        </div>

      </div>

    </div>
  );
}
