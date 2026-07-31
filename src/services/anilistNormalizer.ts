import {
  AniListResponse,
  NormalizedAnime,
  NormalizedAnimeRelation,
  AniListMedia,
  AniListRelationNode,
} from "../types";

export function normalizeAniList(response: AniListResponse): NormalizedAnime[] {
  const collection = response.data.MediaListCollection;
  if (!collection) return [];

  const normalizedMap = new Map<number, NormalizedAnime>();

  function processRelations(
    node: AniListMedia | AniListRelationNode,
    isRoot: boolean = false,
  ) {
    let existing = normalizedMap.get(node.id);

    const mediaNode = node as AniListMedia;
    const hasFullData = isRoot || !!(mediaNode.title && mediaNode.coverImage);

    if (!existing) {
      existing = {
        id: node.id,
        title: "Unknown Title",
        titles: { english: null, romaji: null, native: null },
        coverImage: "",
        format: "UNKNOWN",
        status: null,
        relations: [],
        inUserLibrary: false,
        originalProviderData: node,
      };
      normalizedMap.set(node.id, existing);
    }

    // Always append any new relations we discover (avoiding duplicates)
    if (node.relations && node.relations.edges) {
      const existingTargetIds = new Set(
        existing.relations.map((r) => r.targetId),
      );
      for (const edge of node.relations.edges) {
        if (!existingTargetIds.has(edge.node.id)) {
          existing.relations.push({
            targetId: edge.node.id,
            relationType: edge.relationType,
          });
          existingTargetIds.add(edge.node.id);
        }
        processRelations(edge.node, false);
      }
    }

    if (hasFullData) {
      existing.title =
        mediaNode.title.english || mediaNode.title.romaji || "Unknown Title";
      existing.titles = {
        english: mediaNode.title.english || null,
        romaji: mediaNode.title.romaji || null,
        native: mediaNode.title.native || null,
      };
      existing.coverImage =
        mediaNode.coverImage && mediaNode.coverImage.large
          ? mediaNode.coverImage.large
          : "";
      existing.format = mediaNode.format || "UNKNOWN";
      existing.originalProviderData = node;
    }
  }

  // First pass: extract all nested graph nodes
  collection.lists.forEach((list) => {
    list.entries.forEach((entry) => {
      processRelations(entry.media, true);
    });
  });

  // Second pass: mark user library entries and update their status
  collection.lists.forEach((list) => {
    list.entries.forEach((entry) => {
      const existing = normalizedMap.get(entry.media.id);
      if (existing) {
        existing.inUserLibrary = true;
        existing.status = entry.status;
        existing.episodesWatched = entry.progress;
      }
    });
  });

  return Array.from(normalizedMap.values());
}
