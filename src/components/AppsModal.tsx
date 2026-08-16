import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  LayoutGrid,
  Activity,
  BookOpen,
  Music,
  ExternalLink,
  Search,
  Sparkles,
  ArrowUpRight,
  Zap,
  Globe,
  Layers,
  ChevronRight,
} from "lucide-react";

interface AppItem {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  badge: string;
  badgeColor: string;
  url?: string;
  actionType: "binance" | "bouk" | "spotify" | "wave" | "external";
}

interface AppsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchBinance: () => void;
  onLaunchBouk: () => void;
  onLaunchSpotify: () => void;
}

export const AppsModal: React.FC<AppsModalProps> = ({
  isOpen,
  onClose,
  onLaunchBinance,
  onLaunchBouk,
  onLaunchSpotify,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [waveStoreOpen, setWaveStoreOpen] = useState<boolean>(false);

  const apps: AppItem[] = [
    {
      id: "binance",
      name: "Binance Live Market",
      category: "Finance & Crypto",
      description:
        "Real-time crypto tickers, live candlestick charts, order books, 24h volume stats, and technical indicators (EMA, RSI, MACD) powered by Binance WebSockets.",
      icon: <Activity className="w-6 h-6 text-amber-500" />,
      iconBg: "bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30",
      badge: "Real-time WS",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      actionType: "binance",
    },
    {
      id: "bouk",
      name: ".Bouk Open Library",
      category: "Education & Research",
      description:
        "Open access digital library format storing 100-page structured HTML ebooks, WAEC & NECO past questions with step-by-step marking schemes, and academic papers.",
      icon: <BookOpen className="w-6 h-6 text-orange-500" />,
      iconBg: "bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/30",
      badge: "100-Page Ebooks",
      badgeColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      actionType: "bouk",
    },
    {
      id: "spotify",
      name: "Spotify Music & Podcasts",
      category: "Media & Audio",
      description:
        "Search millions of songs, albums, and study playlists. Preview tracks with synchronized playback and curated study soundtracks.",
      icon: <Music className="w-6 h-6 text-emerald-500" />,
      iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30",
      badge: "Audio Streaming",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      actionType: "spotify",
    },
    {
      id: "wave-store",
      name: "Wave App Store",
      category: "App Store & Ecosystem",
      description:
        "Explore and install cutting-edge web applications, creative tools, utilities, and developer integrations from the official Wave App Store ecosystem.",
      icon: <Globe className="w-6 h-6 text-sky-500" />,
      iconBg: "bg-sky-500/10 dark:bg-sky-500/20 border-sky-500/30",
      badge: "App Store",
      badgeColor: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      url: "https://wave-app-store.vercel.app/",
      actionType: "wave",
    },
  ];

  const categories = ["All", "Education & Research", "Finance & Crypto", "Media & Audio", "App Store & Ecosystem"];

  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleLaunchApp = (app: AppItem) => {
    if (app.actionType === "binance") {
      onClose();
      onLaunchBinance();
    } else if (app.actionType === "bouk") {
      onClose();
      onLaunchBouk();
    } else if (app.actionType === "spotify") {
      onClose();
      onLaunchSpotify();
    } else if (app.actionType === "wave") {
      setWaveStoreOpen(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Main Apps Modal / Page Window */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-900/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 dark:from-zinc-100 dark:to-zinc-300 text-white dark:text-zinc-900 flex items-center justify-center shadow-md">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-zinc-100">
                  Apps & Extensions
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  Ecosystem
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Launch connected tools, open libraries, financial monitors, and the Wave Store
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-200 dark:hover:bg-zinc-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/40 flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search apps or tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs"
                    : "bg-white dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Apps Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredApps.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-zinc-500 text-sm">
              No apps found matching your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredApps.map((app) => (
                <div
                  key={app.id}
                  className="group relative p-5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/40 hover:bg-white dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Icon + Title + Badge */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs group-hover:scale-105 transition-transform ${app.iconBg}`}
                        >
                          {app.icon}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {app.name}
                          </h3>
                          <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                            {app.category}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${app.badgeColor}`}
                      >
                        {app.badge}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mb-4 line-clamp-3">
                      {app.description}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-200/60 dark:border-zinc-700/60 flex items-center justify-between gap-2">
                    {app.url ? (
                      <div className="flex items-center space-x-2 w-full">
                        <button
                          type="button"
                          onClick={() => handleLaunchApp(app)}
                          className="flex-1 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-sky-600/20 active:scale-95 transition cursor-pointer"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Open in Store Viewer</span>
                        </button>
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-600 transition"
                          title="Open Wave Store in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleLaunchApp(app)}
                        className="w-full px-4 py-2 rounded-xl bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md active:scale-95 transition cursor-pointer"
                      >
                        <span>Launch App</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:px-6 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/90 text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Connected to Kelvis AI Engine</span>
          </div>
          <span className="font-semibold text-slate-600 dark:text-zinc-300">
            {apps.length} Integrated Apps Available
          </span>
        </div>
      </motion.div>

      {/* Wave App Store Embedded Viewer Modal */}
      <AnimatePresence>
        {waveStoreOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setWaveStoreOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-6xl h-[94vh] bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10"
            >
              {/* Wave Store Header */}
              <div className="px-4 py-3 bg-slate-100 dark:bg-zinc-900 border-b border-slate-300 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-xs">
                    W
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center space-x-2">
                      <span>Wave App Store</span>
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                        wave-app-store.vercel.app
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href="https://wave-app-store.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold flex items-center space-x-1 transition"
                  >
                    <span>Open in New Window</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => setWaveStoreOpen(false)}
                    className="p-1.5 rounded-xl bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Iframe View */}
              <div className="flex-1 w-full bg-slate-900 relative">
                <iframe
                  src="https://wave-app-store.vercel.app/"
                  title="Wave App Store"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
