import React, { useState, useEffect } from "react";
import { BookOpen, Calendar, User, Search, Clock, ChevronRight, Terminal, Award, HelpCircle } from "lucide-react";
import Markdown from "react-markdown";
import { db } from "../firebase";
import { collection, query, getDocs, orderBy } from "firebase/firestore";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  role: string;
  publishDate: string;
  readTime: string;
  category: string;
  tags: string[];
}

const ENGINE_BLOGS: BlogPost[] = [
  {
    id: "self-host-database",
    title: "The Ultimate Guide to Self-Hosting PostgreSQL on Cloud SQL with Scaled Ingress",
    excerpt: "Learn how we configured high-throughput PostgreSQL for 500,000 active devices with custom read-replicas, multi-tenant schemas, and auto-vacuuming optimizations.",
    content: `## The Self-Hosting Revolution

As SaaS products scale, database pricing under proprietary models can become astronomical. Moving to standard **PostgreSQL** or **Cloud SQL** is the single most effective way to secure absolute data sovereignty, reduce database overhead by up to **80%**, and establish total vendor independence.

### The Standard Architecture

For standard multi-tenant architectures, we configure high-performance replication pools using:
- **Primary Node**: Handles heavy write queries, transactional states, and batch upserts.
- **Read Replicas**: Decouples analytical dashboard telemetry and search listing filters from core operations.

\`\`\`sql
-- Sample highly tuned connection pooling strategy
ALTER SYSTEM SET max_connections = 500;
ALTER SYSTEM SET shared_buffers = '4GB'; -- Match 25% of memory allocation
ALTER SYSTEM SET work_mem = '32MB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
\`\`\`

### The Strategy for Multi-Tenant Partitioning
To guarantee zero-trust boundaries at the database level, implement **Row-Level Security (RLS)**:

\`\`\`sql
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON user_data
    USING (tenant_id = current_setting('app.current_tenant_id'));
\`\`\`

This guarantees that even if a server-side query is misconfigured, no data can leak across user segments. Keep building dynamically!`,
    author: "Elena Rostova",
    role: "Core Infra Systems Eng",
    publishDate: "June 10, 2026",
    readTime: "6 min read",
    category: "Infrastructure",
    tags: ["databases", "self-hosting", "postgres", "cloud-sql"]
  },
  {
    id: "firebase-to-raw-cloud",
    title: "Vaporizing the Vendor Lock-In: Migrating off Complex Proprietary BaaS Frameworks",
    excerpt: "A standard, concrete blueprint for moving real-time subscriptions, nested profiles, and complex asset blobs safely into self-consistent SQL tables.",
    content: `## Why Migrate Off Proprietary Backend-as-a-Service?

Proprietary BaaS backends excel at 24-hour hackathons, but they eventually present painful bottlenecks:
1. **Unpredictable Pricing**: O(N) operations can easily trigger massive unexpected billing cycles on deep collection reads.
2. **Brittle Queries**: Complex sorting, full-text operations, and joins are structurally limited in document-based document stores.
3. **Data Lock-In**: Having schemas defined solely on the client-side degrades backend validation over time.

### The Modern Modular Alternative
Instead, we recommend utilizing a **modular stack** combining:
- **Express / Node.js**: Type-safe REST and real-time WebSockets.
- **Drizzle ORM**: Transparent SQL generation with automated migrations.
- **PostgreSQL / Cloud SQL**: Solid-state relatory database with rich constraint guards.

### Step 1: Mapping NoSQL Documents to Consistent SQL Relations
NoSQL models are usually denormalized. Here is how we decompose a typical nested user-profile into safe SQL declarations:

\`\`\`typescript
export const usersRelation = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
\`\`\``,
    author: "Jake Wheelock",
    role: "Senior Solutions Architect",
    publishDate: "June 08, 2026",
    readTime: "9 min read",
    category: "Development",
    tags: ["migration", "firebase", "sql", "architecture"]
  },
  {
    id: "tailwind-v4-performance",
    title: "Mastering Tailwind v4: Brutalist Web Aesthetics and Sub-10ms Paint Benchmarks",
    excerpt: "How we leveraged compiled CSS-engine plugins, custom theme variables, and neo-minimalist contrast design to build pages that load instantly everywhere.",
    content: `## Brutalism & Extreme Performance

Brutalist web design is more than a creative aesthetic — it is a pledge to high accessibility, visual honesty, and extreme utility. By stripping unnecessary background gradients, deep drop shadows, and complex state charts, we create interfaces that load with **almost-zero latency**.

### Building with Tailwind v4 CSS Assets
Tailwind v4 comes with outstanding native performance enhancements by compiling styles directly inside Vite pipelines:

\`INCOMING CSS:\`
\`\`\`css
@import "tailwindcss";

@theme {
  --color-neo-pink: #fbcfe8;
  --color-neo-yellow: #fde047;
  --font-display: "Space Grotesk", sans-serif;
}
\`\`\`

### Implementing the Brutalist Button Accent
Achieve high-contrast tactile feel using clean black borders and hard shadow-offsets:

\`\`\`html
<button className="px-4 py-2 bg-neo-yellow border-4 border-black font-black uppercase text-xs rounded-xl shadow-[4px_4px_0_0_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5.5px_5.5px_0_0_#000000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-100">
  Tactile Widget
</button>
\`\`\`

By ensuring zero runtime layout shifts (CLS), users on mobile devices or low-bandwidth environments can discover and upvote alternatives with impeccable speed.`,
    author: "Maya Lin",
    role: "Brutalist Design Lead",
    publishDate: "May 25, 2026",
    readTime: "4 min read",
    category: "Design",
    tags: ["tailwind", "css", "brutalism", "performance"]
  }
];

export default function BlogsPage() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [dynamicBlogs, setDynamicBlogs] = useState<BlogPost[]>([]);

  const categories = ["All", "Infrastructure", "Development", "Design", "AI Comparison"];

  useEffect(() => {
    async function loadComparisonBlogs() {
      try {
        const querySnapshot = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc")));
        const posts: BlogPost[] = [];
        querySnapshot.forEach((docSnap) => {
          if (docSnap.id.startsWith("post_aeo_")) {
            const data = docSnap.data();
            const date = data.createdAt 
              ? (typeof data.createdAt.toDate === "function" ? data.createdAt.toDate().toLocaleDateString() : new Date(data.createdAt).toLocaleDateString()) 
              : "Recently";
            
            // Clean up content snippet for excerpt
            const cleanExcerpt = (data.content || "")
              .substring(0, 180)
              .replace(/[#*`>_\-]/g, "")
              .trim() + "...";

            posts.push({
              id: docSnap.id,
              title: data.title || "AI Comparison Duel",
              content: data.content || "",
              excerpt: cleanExcerpt,
              author: data.authorName || "OpenAlt AI Agent",
              role: "AI Spec Analyst",
              publishDate: date,
              readTime: "5 min read",
              category: "AI Comparison",
              tags: data.tags || ["AEO"]
            });
          }
        });
        setDynamicBlogs(posts);
      } catch (err) {
        console.warn("Failed to load dynamic comparison blogs:", err);
      }
    }
    loadComparisonBlogs();
  }, []);

  const allBlogs = [...ENGINE_BLOGS, ...dynamicBlogs];

  const filtered = allBlogs.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase()) || 
                          post.excerpt.toLowerCase().includes(search.toLowerCase()) ||
                          post.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header Flare banner */}
      <div className="bg-[#67e8f9] p-6 md:p-8 border-4 border-black rounded-2xl shadow-[6px_6px_0_0_#000000] space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-cyan-200 opacity-40 rounded-full border-4 border-dashed border-black translate-x-12 -translate-y-12 pointer-events-none" />
        <h1 className="text-3xl font-black text-black tracking-tight flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-black fill-cyan-100 stroke-[2.5px]" />
          OpenAlt Engineering Blog
        </h1>
        <p className="text-sm text-stone-850 font-bold max-w-xl leading-relaxed">
          In-depth tutorials, self-hosting configurations, migration blueprints, and expert guidelines for taking back control of your developer data.
        </p>
      </div>

      {selectedPost ? (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedPost(null)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border-2 border-black rounded-lg text-xs font-black uppercase shadow-[3px_3px_0_0_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_0_#000000] transition-all cursor-pointer"
          >
            &larr; Back to Articles
          </button>

          <div className="bg-white border-4 border-black p-6 md:p-8 rounded-2xl shadow-[6px_6px_0_0_#000000] space-y-6">
            <div className="border-b-2 border-black pb-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-black text-stone-600">
                <span className="bg-[#ccdffd] border border-black text-blue-900 px-2 py-0.5 rounded-md uppercase">
                  {selectedPost.category}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {selectedPost.publishDate}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {selectedPost.readTime}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-black leading-tight tracking-tight">
                {selectedPost.title}
              </h1>

              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full border-2 border-black bg-[#ddd6fe] flex items-center justify-center font-black text-xs text-black shadow-[1px_1px_0_0_#000000]">
                  {selectedPost.author.charAt(0)}
                </div>
                <div>
                  <p className="font-extrabold text-xs text-black leading-none">{selectedPost.author}</p>
                  <p className="text-[9px] font-mono text-stone-500 mt-0.5 uppercase tracking-wide leading-none">{selectedPost.role}</p>
                </div>
              </div>
            </div>

            {/* Markdown rendering of body */}
            <div className="prose max-w-none prose-stone prose-headings:font-sans prose-headings:font-black prose-headings:text-black prose-p:text-xs prose-p:font-semibold prose-p:leading-relaxed prose-a:text-blue-600 prose-a:underline font-sans text-stone-850 text-xs overflow-wrap break-all select-text">
              <Markdown>{selectedPost.content}</Markdown>
            </div>

            {/* Tags footer */}
            <div className="border-t border-dashed border-stone-300 pt-4 flex flex-wrap gap-2 text-[10px] font-mono font-bold">
              {selectedPost.tags.map(t => (
                <span key={t} className="bg-stone-150 border border-black rounded px-1.5 py-0.5">
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white border-4 border-black p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-[4px_4px_0_0_#000000]">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-black stroke-[3px]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search articles, tags, authors..."
                className="w-full bg-white border-2 border-black rounded-lg pl-10 pr-4 py-2 text-xs placeholder-stone-500 font-bold focus:outline-none"
              />
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto font-mono text-[10px] font-black pb-1 md:pb-0 scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`border-2 border-black rounded-full px-3 py-1.5 transition-all text-xs cursor-pointer ${
                    selectedCategory === cat 
                      ? "bg-black text-white shadow-none" 
                      : "bg-stone-50 hover:bg-stone-100 text-black shadow-[1.5px_1.5px_0_0_#000000]"
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* List layout */}
          {filtered.length === 0 ? (
            <div className="bg-white border-4 border-black p-12 text-center rounded-2xl shadow-[4px_4px_0_0_#000000] uppercase font-mono font-bold text-stone-500">
              No engineering guides match your query parameters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map(post => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="group bg-white border-4 border-black rounded-2xl p-5 shadow-[5px_5px_0_0_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_0_#000000] transition-all flex flex-col justify-between space-y-4 cursor-pointer"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between font-mono text-[9px] font-black text-stone-500 uppercase pb-1.5 border-b border-stone-200">
                      <span className="bg-[#ddd6fe] text-black border border-black px-1.5 py-0.5 rounded">
                        {post.category}
                      </span>
                      <span>{post.readTime}</span>
                    </div>

                    <h3 className="text-base font-black text-black group-hover:underline leading-tight tracking-tight">
                      {post.title}
                    </h3>
                    <p className="text-xs text-stone-650 leading-relaxed font-bold">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-dashed border-stone-200 pt-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-6 w-6 rounded-full border border-black bg-stone-100 flex items-center justify-center font-black text-[10px] text-black shadow-[1px_1px_0_0_#000000]">
                        {post.author.charAt(0)}
                      </div>
                      <span className="text-[10px] font-extrabold text-stone-700">{post.author}</span>
                    </div>

                    <span className="text-[10px] font-mono font-extrabold text-[#7c3aed] group-hover:translate-x-1.5 transition-all flex items-center gap-0.5">
                      READ MANUAL <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
