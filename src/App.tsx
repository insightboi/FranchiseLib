import React, { useState, useMemo } from "react";
import { useAnimeLibrary, ProviderType } from "./hooks/useAnimeLibrary";
import { Dashboard } from "./components/Dashboard";
import { FranchiseCard } from "./components/FranchiseCard";
import {
  DEFAULT_VISIBILITY,
  filterVisibleEntries,
  VisibilityConfig,
} from "./services/visibility";

export default function App() {
  const [userName, setUserName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [provider, setProvider] = useState<ProviderType>("anilist");
  const [visibility, setVisibility] =
    useState<VisibilityConfig>(DEFAULT_VISIBILITY);

  const { franchises, isLoading, error, loadLibrary, resetLibrary } =
    useAnimeLibrary();

  const handleFetch = (e: React.FormEvent) => {
    e.preventDefault();
    loadLibrary(userName, provider);
    setExpandedIds(new Set());
  };

  const visibleFranchises = useMemo(() => {
    return franchises
      .map((f) => ({
        ...f,
        entries: filterVisibleEntries(f.entries, visibility),
      }))
      .filter((f) => f.entries.length > 0);
  }, [franchises, visibility]);

  const filteredFranchises = useMemo(() => {
    if (!searchQuery.trim()) return visibleFranchises;
    const lowerQuery = searchQuery.toLowerCase();
    return visibleFranchises.filter(
      (f) =>
        f.title.toLowerCase().includes(lowerQuery) ||
        f.entries.some((e) => e.title.toLowerCase().includes(lowerQuery)),
    );
  }, [visibleFranchises, searchQuery]);

  const stats = useMemo(() => {
    let totalEntries = 0;
    let completedEntries = 0;
    let watchingEntries = 0;
    let onHoldEntries = 0;
    let droppedEntries = 0;
    let planningEntries = 0;
    let watchedEpisodes = 0;

    for (const f of visibleFranchises) {
      for (const e of f.entries) {
        totalEntries++;
        if (e.status === "COMPLETED") completedEntries++;
        else if (e.status === "CURRENT" || e.status === "REPEATING")
          watchingEntries++;
        else if (e.status === "PAUSED") onHoldEntries++;
        else if (e.status === "DROPPED") droppedEntries++;
        else if (e.status === "PLANNING") planningEntries++;

        if (e.episodesWatched) {
          watchedEpisodes += e.episodesWatched;
        }
      }
    }

    return {
      totalFranchises: visibleFranchises.length,
      totalEntries,
      completedEntries,
      watchingEntries,
      onHoldEntries,
      droppedEntries,
      planningEntries,
      watchedEpisodes,
    };
  }, [visibleFranchises]);

  const toggleExpandAll = () => {
    if (
      expandedIds.size === filteredFranchises.length &&
      filteredFranchises.length > 0
    ) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(filteredFranchises.map((f) => f.id)));
    }
  };

  const toggleFranchise = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allExpanded =
    filteredFranchises.length > 0 &&
    expandedIds.size === filteredFranchises.length;

  return (
    <div className="bg-[#09090b] text-zinc-100 min-h-screen flex flex-col font-sans overflow-x-hidden">
      <nav className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 md:px-8 shrink-0 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-900/20">
            FL
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:block">
            Franchise<span className="text-indigo-500">Lib</span>
          </span>
        </div>

        {franchises.length > 0 && (
          <div className="flex-1 max-w-md mx-4 md:mx-12">
            <div className="relative flex items-center">
              <svg
                className="absolute left-3 w-4 h-4 text-zinc-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
              <input
                type="text"
                placeholder="Search your collection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-zinc-500 transition-shadow"
              />
            </div>
          </div>
        )}

        {franchises.length > 0 && (
          <div className="flex gap-2 md:gap-3">
            <button
              onClick={() => setExpandedIds(new Set())}
              className="px-3 md:px-4 py-2 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors hidden sm:block"
            >
              Collapse All
            </button>
            <button
              onClick={toggleExpandAll}
              className="px-3 md:px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-lg shadow-indigo-900/20 whitespace-nowrap"
            >
              {allExpanded ? "Collapse All" : "Expand All"}
            </button>
          </div>
        )}
      </nav>

      <main className="flex-1 p-4 md:p-6 w-full max-w-[1400px] mx-auto flex flex-col">
        {!franchises.length && !isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl w-full shadow-xl">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-indigo-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    ></path>
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-center mb-2">
                {provider === "anilist"
                  ? "AniList Import"
                  : "MyAnimeList Import"}
              </h1>
              <p className="text-zinc-400 text-sm text-center mb-6">
                {provider === "anilist"
                  ? "Enter your AniList username to cluster your completed and currently watching anime into franchises."
                  : "Enter your MyAnimeList username to import your public library."}
              </p>

              <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 mb-6">
                <button
                  type="button"
                  onClick={() => setProvider("anilist")}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${provider === "anilist" ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  AniList
                </button>
                <button
                  type="button"
                  onClick={() => setProvider("myanimelist")}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${provider === "myanimelist" ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  MyAnimeList
                </button>
              </div>

              <form onSubmit={handleFetch} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder={
                    provider === "anilist"
                      ? "AniList Username"
                      : "MyAnimeList Username"
                  }
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-zinc-600"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 flex items-center justify-center text-sm font-medium bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <svg
                      className="w-4 h-4 mr-2 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : null}
                  {isLoading ? "Importing..." : "Load Library"}
                </button>
              </form>
              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-400 text-sm">
                  <svg
                    className="w-4 h-4 mt-0.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {franchises.length > 0 && (
          <div className="animate-in fade-in duration-700 flex flex-col gap-6">
            <Dashboard stats={stats} />

            <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl flex flex-wrap gap-6 items-center shrink-0">
              <span className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                Visibility
              </span>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer text-zinc-300 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={visibility.watching}
                    onChange={(e) =>
                      setVisibility((v) => ({
                        ...v,
                        watching: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500/50 focus:ring-offset-zinc-900"
                  />
                  Watching
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer text-zinc-300 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={visibility.completed}
                    onChange={(e) =>
                      setVisibility((v) => ({
                        ...v,
                        completed: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-zinc-900"
                  />
                  Completed
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer text-zinc-300 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={visibility.onHold}
                    onChange={(e) =>
                      setVisibility((v) => ({ ...v, onHold: e.target.checked }))
                    }
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-zinc-500 focus:ring-zinc-500/50 focus:ring-offset-zinc-900"
                  />
                  On Hold
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer text-zinc-300 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={visibility.dropped}
                    onChange={(e) =>
                      setVisibility((v) => ({
                        ...v,
                        dropped: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-red-500 focus:ring-red-500/50 focus:ring-offset-zinc-900"
                  />
                  Dropped
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer text-zinc-300 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={visibility.planning}
                    onChange={(e) =>
                      setVisibility((v) => ({
                        ...v,
                        planning: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-zinc-900"
                  />
                  Planning
                </label>
              </div>
            </div>

            {filteredFranchises.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 bg-zinc-900/40 border border-zinc-800 rounded-xl">
                No franchises found matching your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
                {filteredFranchises.map((franchise) => {
                  const isOpen = expandedIds.has(franchise.id);
                  return (
                    <div
                      key={franchise.id}
                      className={
                        isOpen
                          ? "col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4"
                          : "col-span-1"
                      }
                    >
                      <FranchiseCard
                        franchise={franchise}
                        isOpen={isOpen}
                        onToggle={() => toggleFranchise(franchise.id)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {franchises.length > 0 && (
        <footer className="h-10 border-t border-zinc-800 flex items-center px-4 md:px-8 text-[10px] text-zinc-500 gap-4 shrink-0 mt-auto bg-[#09090b]">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            Connected to {provider === "anilist" ? "AniList" : "MyAnimeList"}
          </div>
          <span className="hidden sm:inline">•</span>
          <div className="hidden sm:block">
            Total items: {stats.totalEntries}
          </div>
          <div className="ml-auto italic">Franchise Clustering v1.0.5</div>
        </footer>
      )}
    </div>
  );
}
