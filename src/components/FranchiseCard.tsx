import React from "react";
import { Franchise } from "../types";

interface FranchiseCardProps {
  franchise: Franchise;
  isOpen: boolean;
  onToggle: () => void;
}

export const FranchiseCard: React.FC<FranchiseCardProps> = ({
  franchise,
  isOpen,
  onToggle,
}) => {
  if (isOpen) {
    return (
      <div className="bg-zinc-900/50 border border-indigo-500/30 rounded-2xl overflow-hidden flex flex-col ring-1 ring-indigo-500/10 shadow-2xl transition-all h-full max-h-[800px]">
        <div className="flex h-[180px] shrink-0">
          <div className="w-32 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4 relative overflow-hidden hidden sm:flex">
            {franchise.coverImage && (
              <img
                src={franchise.coverImage}
                alt={franchise.title}
                className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="w-full h-full border-2 border-white/20 rounded shadow-lg relative z-10 overflow-hidden bg-black/40 backdrop-blur-sm">
              {franchise.coverImage && (
                <img
                  src={franchise.coverImage}
                  alt={franchise.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          </div>
          <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start gap-4">
              <h3
                className="text-xl sm:text-2xl font-bold line-clamp-2"
                title={franchise.title}
              >
                {franchise.title}
              </h3>
              <span className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] uppercase font-bold text-zinc-400 whitespace-nowrap shrink-0">
                {franchise.entries.length} Entries
              </span>
            </div>

            <button
              onClick={onToggle}
              className="mt-4 text-xs font-semibold text-indigo-400 flex items-center gap-1 hover:text-indigo-300 w-fit"
            >
              Collapse Franchise
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M19 9l-7 7-7-7"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 border-t border-zinc-800 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 overflow-y-auto">
          {franchise.entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 bg-zinc-950 p-2 rounded-lg border border-zinc-800"
            >
              <div className="w-10 h-14 bg-zinc-800 rounded shrink-0 overflow-hidden">
                {entry.coverImage && (
                  <img
                    src={entry.coverImage}
                    alt={entry.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-semibold truncate"
                  title={entry.title}
                >
                  {entry.title}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-0.5">
                  <span className="uppercase bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                    {entry.format.replace("_", " ")}
                  </span>
                  <span>•</span>
                  {entry.status ? (
                    <span
                      className={
                        entry.status === "COMPLETED"
                          ? "text-emerald-500 uppercase"
                          : entry.status === "CURRENT"
                            ? "text-amber-500 uppercase font-bold"
                            : entry.status === "PAUSED"
                              ? "text-orange-400 uppercase"
                              : entry.status === "DROPPED"
                                ? "text-red-500 uppercase"
                                : "text-zinc-500 uppercase"
                      }
                    >
                      {entry.status}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onToggle}
      className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 flex gap-4 transition-all hover:bg-zinc-900/60 cursor-pointer h-full"
    >
      <div className="w-20 h-28 bg-zinc-800 rounded-xl shrink-0 overflow-hidden shadow-lg shadow-black/20">
        {franchise.coverImage && (
          <img
            src={franchise.coverImage}
            alt={franchise.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        )}
      </div>
      <div className="flex flex-col justify-center gap-1 flex-1 min-w-0">
        <h4
          className="font-bold text-lg leading-tight line-clamp-2"
          title={franchise.title}
        >
          {franchise.title}
        </h4>
        <div className="text-xs text-zinc-500">
          {franchise.entries.length} Entries
        </div>
        <button className="mt-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest text-left">
          Expand +
        </button>
      </div>
    </div>
  );
};
