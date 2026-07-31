import { NormalizedAnime } from "../types";

export interface VisibilityConfig {
  watching: boolean;
  completed: boolean;
  onHold: boolean;
  dropped: boolean;
  planning: boolean;
}

export const DEFAULT_VISIBILITY: VisibilityConfig = {
  watching: true,
  completed: true,
  onHold: true,
  dropped: true,
  planning: false,
};

export function filterVisibleEntries(
  entries: NormalizedAnime[],
  visibility: VisibilityConfig,
): NormalizedAnime[] {
  return entries.filter((entry) => {
    switch (entry.status) {
      case "CURRENT":
      case "REPEATING":
        return visibility.watching;
      case "COMPLETED":
        return visibility.completed;
      case "PAUSED":
        return visibility.onHold;
      case "DROPPED":
        return visibility.dropped;
      case "PLANNING":
        return visibility.planning;
      default:
        // If an entry has no status or an unknown status, default to visible.
        return true;
    }
  });
}
