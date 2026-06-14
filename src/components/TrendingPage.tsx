import React, { useState, useEffect } from "react";
import { 
  Flame, 
  ArrowUp, 
  Star, 
  Bookmark, 
  Share2, 
  RefreshCw, 
  ChevronRight, 
  TrendingUp,
  Sparkles,
  Award
} from "lucide-react";
import { motion } from "motion/react";
import { Project } from "../types";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  updateDoc,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  serverTimestamp
} from "firebase/firestore";

interface TrendingPageProps {
  onSelectProject: (project: Project) => void;
  isBookmarked: (id: string) => boolean;
  onToggleBookmark: (project: Project) => void;
  addToast: (message: string, type?: "success" | "info" | "warning") => void;
  featuredProjects?: Project[];
  featuredLoading?: boolean;
}

export default function TrendingPage({
  onSelectProject,
  isBookmarked,
  onToggleBookmark,
  addToast,
  featuredProjects = [],
  featuredLoading = false
}: TrendingPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"trending" | "featured">("trending");

  async function fetchTrendingProjects() {
    setLoading(true);
    const path = "projects";
    try {
      const q = query(collection(db, path), orderBy("createdAt", "desc"), limit(40));
      const querySnapshot = await getDocs(q);
      const loaded: Project[] = [];
      querySnapshot.forEach((doc) => {
        loaded.push(doc.data() as Project);
      });

      const sorted = [...loaded].sort((a, b) => {
        if (b.upvotes !== a.upvotes) {
          return b.upvotes - a.upvotes;
        }
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setProjects(sorted);
      addToast("Successfully refreshed hottest trending projects!", "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to load trending projects from database", "warning");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTrendingProjects();
  }, []);

  async function handleUpvote(e: React.MouseEvent, project: Project) {
    if (e) e.stopPropagation();
    if (!auth.currentUser) {
      addToast("Please connect your profile to upvote projects!", "warning");
      return;
    }

    const userId = auth.currentUser.uid;
    const likeRef = doc(db, `projects/${project.id}/likes`, userId);
    const projRef = doc(db, "projects", project.id);

    try {
      const likeSnap = await getDoc(likeRef);
      if (likeSnap.exists()) {
        await deleteDoc(likeRef);
        await updateDoc(projRef, {
          upvotes: Math.max(0, (project.upvotes || 1) - 1),
          updatedAt: serverTimestamp()
        });
        addToast(`Removed upvote from ${project.name}`, "info");
      } else {
        await setDoc(likeRef, {
          userId,
          createdAt: serverTimestamp()
        });
        await updateDoc(projRef, {
          upvotes: (project.upvotes || 0) + 1,
          updatedAt: serverTimestamp()
        });
        addToast(`Upvoted ${project.name}! 🔥`, "success");
      }
      fetchTrendingProjects();
    } catch (err) {
      console.error(err);
      addToast("Failed to process upvote", "warning");
    }
  }

  function handleShare(e: React.MouseEvent, project: Project) {
    e.stopPropagation();
    const deepLink = `${window.location.origin}${window.location.pathname}?view=details&project=${encodeURIComponent(project.id)}`;
    navigator.clipboard.writeText(deepLink)
      .then(() => {
        setCopiedId(project.id);
        addToast(`Copied share link for ${project.name}!`, "success");
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch((err) => {
        addToast("Failed to copy link", "warning");
      });
  }

  // Slice podium
  const podiumProjects = featuredProjects.slice(0, 3);
  const remainingFeatured = featuredProjects.slice(3);
  const rank1 = podiumProjects[0];
  const rank2 = podiumProjects[1];
  const rank3 = podiumProjects[2];

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header Flare banner */}
      <div className="bg-[#fed7aa] p-6 md:p-8 border-4 border-black rounded-2xl shadow-[6px_6px_0_0_#000000] space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-36 w-36 bg-orange-300 opacity-30 rounded-full border-4 border-dashed border-black translate-x-12 -translate-y-12 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-black tracking-tight flex items-center gap-2">
              <Flame className="h-8 w-8 text-orange-600 fill-orange-500 animate-pulse stroke-[2.5px]" />
              Rankings & Curations
            </h1>
            <p className="text-sm text-stone-800 font-bold max-w-xl leading-relaxed">
              Explore openalt performance rankings and premium vetted featured alternatives in unified metrics.
            </p>
          </div>
          
          <button
            onClick={fetchTrendingProjects}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 text-black border-3 border-black rounded-xl text-xs font-black uppercase shadow-[3px_3px_0_0_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer grow-0 shrink-0 self-start md:self-center"
          >
            <RefreshCw className={`h-4 w-4 stroke-[3px] text-black ${loading ? "animate-spin" : ""}`} />
            <span>Sync Stats</span>
          </button>
        </div>
      </div>

      {/* Dynamic Sub-Tab Selector */}
      <div className="flex border-4 border-black rounded-xl p-1 bg-stone-100 max-w-md shadow-[3px_3px_0_0_#000000]">
        <button
          onClick={() => setActiveSubTab("trending")}
          className={`flex-1 py-2.5 text-xs font-black uppercase text-center rounded-lg transition-all cursor-pointer ${
            activeSubTab === "trending"
              ? "bg-black text-white shadow-none"
              : "text-black hover:bg-stone-200"
          }`}
        >
          🔥 Hottest Trending
        </button>
        <button
          onClick={() => setActiveSubTab("featured")}
          className={`flex-1 py-2.5 text-xs font-black uppercase text-center rounded-lg transition-all cursor-pointer ${
            activeSubTab === "featured"
              ? "bg-[#fbcfe8] text-black border-2 border-black font-black"
              : "text-black hover:bg-stone-200"
          }`}
        >
          🏆 Curated Featured
        </button>
      </div>

      {/* RENDER ACTIVE MODE */}
      {activeSubTab === "trending" ? (
        /* TRENDING LISTING VIEW */
        loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="h-10 w-10 text-black animate-spin stroke-[2.5px]" />
            <p className="text-xs font-mono text-stone-700 font-extrabold uppercase tracking-widest">
              Quarrying Firestore Trending Index...
            </p>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white border-4 border-black p-12 text-center text-stone-700 uppercase font-mono font-bold tracking-wider rounded-2xl shadow-[6px_6px_0_0_#000000]">
            No trending projects submitted yet. Go upvote projects on Discovery to launch them!
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b-2 border-dashed border-stone-300 pb-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <span className="font-mono text-xs font-black uppercase text-stone-700">
                COMMUNITY TRENDING POWER RANKINGS ({projects.length} listed)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((proj, idx) => {
                const isFav = isBookmarked(proj.id);
                const rank = idx + 1;
                return (
                  <div
                    key={proj.id}
                    onClick={() => onSelectProject(proj)}
                    className="group bg-white border-4 border-black rounded-2xl p-5 shadow-[5px_5px_0_0_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_0_#000000] transition-all flex flex-col justify-between space-y-4 cursor-pointer relative"
                  >
                    {/* Rank badge */}
                    <div className="absolute -top-3.5 -left-3.5 h-8 w-8 rounded-lg bg-black border-2 border-black flex items-center justify-center text-yellow-300 font-mono font-black text-sm shadow-[1.5px_1.5px_0_0_#ea580c] z-10">
                      #{rank}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-2 pl-3">
                        <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-orange-100 text-orange-850 border border-black px-2 py-0.5 rounded">
                          {proj.type === "saas" ? "SaaS Alternative" : "Open Source"}
                        </span>
                        
                        <button
                          onClick={(e) => handleUpvote(e, proj)}
                          className="flex items-center gap-1 bg-[#ffedd5] hover:bg-[#fed7aa] border-2 border-black px-2 py-0.5 rounded-lg text-xs font-mono font-black text-black shadow-[1.5px_1.5px_0_0_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer shrink-0"
                          title="Upvote alternative"
                        >
                          <ArrowUp className="h-3.5 w-3.5 text-orange-600 stroke-[3px]" />
                          <span>{(proj.upvotes || 0)}</span>
                        </button>
                      </div>

                      <div className="pl-2">
                        <h4 className="text-lg font-sans font-black text-black group-hover:underline flex items-center justify-between gap-2">
                          <span className="truncate">{proj.name}</span>
                          <ChevronRight className="h-4 w-4 stroke-[2.5px] scale-0 group-hover:scale-100 transition-all text-black shrink-0" />
                        </h4>
                        <p className="text-xs text-stone-600 font-bold leading-relaxed line-clamp-3 mt-1.5">
                          {proj.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-stone-200 pt-3 text-xs font-mono pl-2">
                      <span className="font-extrabold text-[#7c3aed] uppercase truncate max-w-[120px]">
                        {proj.language || "TypeScript"}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleShare(e, proj)}
                          className="p-1.5 rounded-lg border-2 border-black bg-stone-50 hover:bg-stone-100 text-black shadow-[1.5px_1.5px_0_0_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer relative"
                          title="Copy Share Link"
                        >
                          {copiedId === proj.id ? (
                            <span className="text-[8px] font-mono font-black text-green-600">Copied!</span>
                          ) : (
                            <Share2 className="h-3.5 w-3.5 stroke-[2.5px]" />
                          )}
                        </button>

                        <button
                          onClick={() => onToggleBookmark(proj)}
                          className={`p-1.5 rounded-lg border-2 border-black transition-all shadow-[1.5px_1.5px_0_0_#000000] cursor-pointer ${
                            isFav ? "bg-[#ec4899] text-white" : "bg-white text-black hover:bg-stone-50"
                          }`}
                          title="Bookmark Alternative"
                        >
                          <Bookmark className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : (
        /* CURATED FEATURED VIEW */
        featuredLoading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
            <div className="h-10 w-10 text-black animate-spin border-4 border-[#fbcfe8] border-t-black rounded-full" />
            <p className="text-xs font-extrabold uppercase tracking-widest font-mono">Syncing Curations...</p>
          </div>
        ) : featuredProjects.length === 0 ? (
          <div className="bg-white border-4 border-black p-12 text-center text-stone-700 uppercase font-mono font-bold tracking-wider rounded-2xl shadow-[6px_6px_0_0_#000000]">
            Curated list indexes are blank. Upvote projects on Project Discovery to display them!
          </div>
        ) : (
          <div className="space-y-12">
            {/* PINNACLE PODIUM SHOWCASE GRID */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-black uppercase tracking-wider text-black bg-[#a7f3d0] border-2 border-black px-2.5 py-1 rounded inline-block shadow-[1.5px_1.5px_0_0_#000000]">
                🏆 Pinnacle Top 3 Podium
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end pt-5">
                {/* 🥈 Silver Podium Card (Rank 2) */}
                {rank2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="order-2 lg:order-1"
                  >
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                      onClick={() => onSelectProject(rank2)}
                      className="bg-white border-4 border-black rounded-2xl p-6 shadow-[5px_5px_0_0_#000000] cursor-pointer hover:shadow-[8px_8px_0_0_#000000] transition-all relative overflow-hidden group border-stone-400"
                    >
                      <div className="absolute top-2 right-2 bg-stone-100 border-2 border-stone-400 text-stone-600 font-black px-2 py-0.5 rounded-md text-[10px] font-mono shadow-[1px_1px_0_0_#000000]">
                        RANK 2
                      </div>
                      <div className="space-y-3">
                        <span className="inline-block text-[10px] font-mono font-black px-2 py-0.5 bg-stone-105 border border-black rounded uppercase text-stone-650">
                          🥈 Silver Medalist
                        </span>
                        <h4 className="text-xl font-black text-black tracking-tight group-hover:text-amber-850 transition">
                          {rank2.name}
                        </h4>
                        <p className="text-xs text-stone-600 font-bold leading-relaxed line-clamp-4">
                          {rank2.description}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t-2 border-dashed border-black flex items-center justify-between text-xs">
                        <span className="font-mono text-[10px] font-black bg-stone-100 text-black px-2 py-0.5 border border-black rounded">
                          {rank2.language}
                        </span>
                        <span className="font-black text-stone-700">★ {rank2.rating} / 5</span>
                      </div>
                    </motion.div>
                    <div className="hidden lg:block h-8 bg-stone-200 border-x-4 border-b-4 border-black rounded-b-xl shadow-[5px_5px_0_0_#000000] text-center pt-1 text-[10px] font-mono font-black text-stone-500 uppercase">
                      Runner Up Pedestal
                    </div>
                  </motion.div>
                )}

                {/* 🥇 Gold Podium Card (Rank 1) */}
                {rank1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="order-1 lg:order-2"
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                      onClick={() => onSelectProject(rank1)}
                      className="bg-[#fef08a] border-4 border-black rounded-2xl p-6 shadow-[7px_7px_0_0_#000000] cursor-pointer hover:shadow-[10px_10px_0_0_#000000] transition-all relative overflow-hidden group scale-102 lg:scale-105 z-10"
                    >
                      <div className="absolute top-2 right-2 bg-yellow-400 border-2 border-black text-black font-mono font-black px-2 py-0.5 rounded-md text-[10px] shadow-[1px_1px_0_0_#000000] animate-pulse">
                        RANK 1
                      </div>
                      <div className="space-y-3">
                        <span className="inline-block text-[10px] font-mono font-black px-2.5 py-0.5 bg-yellow-300 border-2 border-black rounded uppercase text-black shadow-[1px_1px_0_0_#000000]">
                          👑 GRAND CHAMPION
                        </span>
                        <h4 className="text-2xl font-black text-black tracking-tight group-hover:text-amber-900 transition">
                          {rank1.name}
                        </h4>
                        <p className="text-xs text-stone-800 font-extrabold leading-relaxed line-clamp-5">
                          {rank1.description}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t-2 border-dashed border-black flex items-center justify-between text-xs">
                        <span className="font-mono text-[10px] font-black bg-white text-black px-2 py-0.5 border border-black rounded">
                          {rank1.language}
                        </span>
                        <span className="font-black text-black uppercase bg-yellow-400 border border-black px-2 py-0.5 rounded font-mono text-[9px] shadow-[1px_1px_0_0_#000000]">
                          ⭐ Rating {rank1.rating}
                        </span>
                      </div>
                    </motion.div>
                    <div className="hidden lg:block h-12 bg-yellow-300 border-x-4 border-b-4 border-black rounded-b-xl shadow-[7px_7px_0_0_#000000] text-center pt-2.5 text-[10px] font-mono font-black text-black uppercase">
                      Supreme Pedestal
                    </div>
                  </motion.div>
                )}

                {/* 🥉 Bronze Podium Card (Rank 3) */}
                {rank3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="order-3 lg:order-3"
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                      onClick={() => onSelectProject(rank3)}
                      className="bg-white border-4 border-black rounded-2xl p-6 shadow-[5px_5px_0_0_#000000] cursor-pointer hover:shadow-[8px_8px_0_0_#000000] transition-all relative overflow-hidden group border-orange-200"
                    >
                      <div className="absolute top-2 right-2 bg-orange-50 border-2 border-orange-300 text-orange-700 font-black px-2 py-0.5 rounded-md text-[10px] font-mono shadow-[1px_1px_0_0_#000000]">
                        RANK 3
                      </div>
                      <div className="space-y-3">
                        <span className="inline-block text-[10px] font-mono font-black px-2 py-0.5 bg-orange-100 border border-orange-300 rounded uppercase text-orange-700">
                          🥉 Bronze Medalist
                        </span>
                        <h4 className="text-xl font-black text-black tracking-tight group-hover:text-orange-900 transition">
                          {rank3.name}
                        </h4>
                        <p className="text-xs text-stone-600 font-bold leading-relaxed line-clamp-4">
                          {rank3.description}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t-2 border-dashed border-black flex items-center justify-between text-xs">
                        <span className="font-mono text-[10px] font-black bg-stone-100 text-black px-2 py-0.5 border border-black rounded">
                          {rank3.language}
                        </span>
                        <span className="font-black text-stone-700">★ {rank3.rating} / 5</span>
                      </div>
                    </motion.div>
                    <div className="hidden lg:block h-8 bg-stone-200 border-x-4 border-b-4 border-black rounded-b-xl shadow-[5px_5px_0_0_#000000] text-center pt-1 text-[10px] font-mono font-black text-stone-500 uppercase">
                      Third Place Pedestal
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* REMAINING CURATED GRID */}
            {remainingFeatured.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-mono font-black uppercase tracking-wider text-black bg-[#ddd6fe] border-2 border-black px-2.5 py-1 rounded inline-block shadow-[1.5px_1.5px_0_0_#000000]">
                  ⭐ Vetted Remaining Curations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {remainingFeatured.map((proj, index) => {
                    const isFav = isBookmarked(proj.id);
                    return (
                      <div
                        key={proj.id}
                        onClick={() => onSelectProject(proj)}
                        className="group bg-[#fffdf5] border-4 border-black rounded-2xl p-5 shadow-[4px_4px_0_0_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000000] transition-all flex flex-col justify-between space-y-4 cursor-pointer"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-1 border-b border-stone-200 pb-2">
                            <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-black px-2 py-0.5 rounded">
                              Featured Alt
                            </span>
                            <span className="text-[10px] uppercase font-mono font-black">Rank #{index + 4}</span>
                          </div>
                          <div>
                            <h4 className="text-base font-black text-black group-hover:underline flex items-center justify-between gap-1.5 leading-none">
                              <span>{proj.name}</span>
                              <ChevronRight className="h-4 w-4 shrink-0 transition-all text-black" />
                            </h4>
                            <p className="text-xs text-stone-600 font-semibold leading-relaxed line-clamp-3 mt-1.5">
                              {proj.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 border-t border-stone-200 pt-3 text-xs font-mono">
                          <span className="font-extrabold text-[#7c3aed] uppercase truncate">
                            {proj.language || "TypeScript"}
                          </span>
                          <span className="font-black text-stone-700 shrink-0">★ {proj.rating} / 5</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
