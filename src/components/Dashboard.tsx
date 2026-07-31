import React from "react";

interface DashboardProps {
  stats: {
    totalFranchises: number;
    totalEntries: number;
    completedEntries: number;
    watchingEntries: number;
    onHoldEntries: number;
    droppedEntries: number;
    planningEntries: number;
    watchedEpisodes: number;
  };
}

export const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
      <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 lg:mb-0">
          Franchises
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{stats.totalFranchises}</span>
          <span className="text-xs text-indigo-400">Umbrellas</span>
        </div>
      </div>
      <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 lg:mb-0">
          Entries
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{stats.totalEntries}</span>
          <span className="text-xs text-indigo-400">Visible</span>
        </div>
      </div>
      <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 lg:mb-0">
          Completed
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{stats.completedEntries}</span>
          <span className="text-xs text-emerald-400 font-medium">Items</span>
        </div>
      </div>
      <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 lg:mb-0">
          Watching
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{stats.watchingEntries}</span>
          <span className="text-xs text-amber-400 animate-pulse">Current</span>
        </div>
      </div>
      <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 lg:mb-0">
          On Hold
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{stats.onHoldEntries}</span>
          <span className="text-xs text-zinc-400">Paused</span>
        </div>
      </div>
      <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 lg:mb-0">
          Dropped
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{stats.droppedEntries}</span>
          <span className="text-xs text-red-400">Items</span>
        </div>
      </div>
      <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 lg:mb-0">
          Planning
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{stats.planningEntries}</span>
          <span className="text-xs text-blue-400">Total</span>
        </div>
      </div>
      <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 lg:mb-0">
          Watched Episodes
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{stats.watchedEpisodes}</span>
          <span className="text-xs text-purple-400">Total</span>
        </div>
      </div>
    </div>
  );
};
