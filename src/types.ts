export type MediaFormat =
  | "TV"
  | "TV_SHORT"
  | "MOVIE"
  | "SPECIAL"
  | "OVA"
  | "ONA"
  | "MUSIC"
  | "MANGA"
  | "NOVEL"
  | "ONE_SHOT"
  | "UNKNOWN";

export type MediaStatus =
  "CURRENT" | "PLANNING" | "COMPLETED" | "DROPPED" | "PAUSED" | "REPEATING";

export interface NormalizedAnimeRelation {
  targetId: number;
  relationType: string;
}

export interface NormalizedAnime {
  id: number;
  title: string;
  titles: {
    english: string | null;
    romaji: string | null;
    native: string | null;
  };
  coverImage: string;
  format: MediaFormat;
  status: MediaStatus | null;
  relations: NormalizedAnimeRelation[];
  inUserLibrary: boolean;
  url?: string;
  userScore?: number;
  episodesWatched?: number;
  totalEpisodes?: number;
  genres?: string[];
  startDate?: string | null;
  endDate?: string | null;
  originalProviderData?: any;
}

export interface AniListTitle {
  english: string | null;
  romaji: string | null;
  native?: string | null;
}

export interface AniListCoverImage {
  large: string | null;
}

export interface AniListRelationNode {
  id: number;
  type: "ANIME" | "MANGA";
  relations?: AniListRelations;
}

export interface AniListRelationEdge {
  relationType: string;
  node: AniListRelationNode;
}

export interface AniListRelations {
  edges: AniListRelationEdge[];
}

export interface AniListMedia {
  id: number;
  title: AniListTitle;
  coverImage: AniListCoverImage;
  format: MediaFormat;
  relations: AniListRelations;
}

export interface AniListListEntry {
  status: MediaStatus;
  progress?: number;
  media: AniListMedia;
}

export interface AniListList {
  name: string;
  entries: AniListListEntry[];
}

export interface AniListMediaListCollection {
  lists: AniListList[];
}

export interface AniListResponse {
  data: {
    MediaListCollection: AniListMediaListCollection;
  };
  errors?: { message: string }[];
}

export type FranchiseEntry = NormalizedAnime;

export interface Franchise {
  id: string;
  title: string;
  coverImage: string;
  entries: FranchiseEntry[];
}

export interface MalAnimeEntry {
  status: number;
  score: number;
  tags: string;
  is_rewatching: number;
  num_watched_episodes: number;
  anime_title: string;
  anime_title_eng: string;
  anime_num_episodes: number;
  anime_airing_status: number;
  anime_id: number;
  has_episode_video: boolean;
  has_promotion_video: boolean;
  has_video: boolean;
  video_url: string;
  anime_url: string;
  anime_image_path: string;
  is_added_to_list: boolean;
  anime_media_type_string: string;
  anime_mpaa_rating_string: string;
  start_date_string: string | null;
  finish_date_string: string | null;
  anime_start_date_string: string | null;
  anime_end_date_string: string | null;
  days_string: number | string | null;
  storage_string: string;
  priority_string: string;
  notes: string;
  editable_notes: string;
}
