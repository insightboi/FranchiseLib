import {
  MalAnimeEntry,
  NormalizedAnime,
  MediaFormat,
  MediaStatus,
} from "../types";

function mapMalStatus(status: number): MediaStatus | null {
  // MAL status mapping: 1 = Watching, 2 = Completed, 3 = On Hold, 4 = Dropped, 6 = Plan to Watch
  switch (status) {
    case 1:
      return "CURRENT";
    case 2:
      return "COMPLETED";
    case 3:
      return "PAUSED";
    case 4:
      return "DROPPED";
    case 6:
      return "PLANNING";
    default:
      return null;
  }
}

function mapMalFormat(typeString: string): MediaFormat {
  const t = typeString.toLowerCase();
  if (t === "tv") return "TV";
  if (t === "ova") return "OVA";
  if (t === "movie") return "MOVIE";
  if (t === "special") return "SPECIAL";
  if (t === "ona") return "ONA";
  if (t === "music") return "MUSIC";
  return "UNKNOWN";
}

export function normalizeMal(entries: MalAnimeEntry[]): NormalizedAnime[] {
  return entries.map((entry) => {
    return {
      id: entry.anime_id,
      title: entry.anime_title_eng || entry.anime_title || "Unknown Title",
      titles: {
        english: entry.anime_title_eng || null,
        romaji: entry.anime_title || null, // MAL usually provides romaji in anime_title
        native: null,
      },
      coverImage: entry.anime_image_path || "",
      format: mapMalFormat(entry.anime_media_type_string),
      status: mapMalStatus(entry.status),
      relations: [], // MAL public API doesn't provide relation graph
      inUserLibrary: true,
      url: entry.anime_url
        ? entry.anime_url.startsWith("http")
          ? entry.anime_url
          : `https://myanimelist.net${entry.anime_url.startsWith("/") ? "" : "/"}${entry.anime_url}`
        : undefined,
      userScore: entry.score,
      episodesWatched: entry.num_watched_episodes,
      totalEpisodes: entry.anime_num_episodes,
      genres: entry.tags
        ? String(entry.tags)
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      startDate: entry.anime_start_date_string,
      endDate: entry.anime_end_date_string,
      originalProviderData: entry,
    };
  });
}
