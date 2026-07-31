import { NormalizedAnime } from "../types";

const ANILIST_API_URL = "https://graphql.anilist.co";

function processRelations(
  node: any,
  map: Map<number, NormalizedAnime>,
  malIdToEntry: Map<number, NormalizedAnime>
) {
  if (node.type && node.type !== "ANIME") return;

  const anilistId = node.id;
  if (!anilistId) return;

  let existing = map.get(anilistId);

  if (!existing) {
    if (node.idMal && malIdToEntry.has(node.idMal)) {
      existing = malIdToEntry.get(node.idMal)!;
      existing.id = anilistId;
      malIdToEntry.delete(node.idMal);
    } else {
      existing = {
        id: anilistId,
        title: node.title?.english || node.title?.romaji || "Unknown Title",
        titles: {
          english: node.title?.english || null,
          romaji: node.title?.romaji || null,
          native: node.title?.native || null,
        },
        coverImage: node.coverImage?.large || "",
        format: node.format || "UNKNOWN",
        status: node.status || null,
        relations: [],
        inUserLibrary: false,
        originalProviderData: null,
      } as NormalizedAnime;
    }
    map.set(anilistId, existing);
  }

  if (node.relations && node.relations.edges) {
    const existingTargetIds = new Set(
      existing.relations.map((r) => r.targetId),
    );
    for (const edge of node.relations.edges) {
      if (edge.node.type && edge.node.type !== "ANIME") continue;

      const targetId = edge.node.id;
      if (!targetId) continue;

      if (!existingTargetIds.has(targetId)) {
        existing.relations.push({
          targetId: targetId,
          relationType: edge.relationType,
        });
        existingTargetIds.add(targetId);
      }
      processRelations(edge.node, map, malIdToEntry);
    }
  }
}

export async function enrichMalRelations(
  entries: NormalizedAnime[],
): Promise<NormalizedAnime[]> {
  const map = new Map<number, NormalizedAnime>();
  const malIdToEntry = new Map<number, NormalizedAnime>();

  for (const entry of entries) {
    malIdToEntry.set(entry.id, entry);
  }

  const initialImportCount = entries.length;

  const allIds = entries
    .map((e) => e.id)
    .filter((id) => id != null && !isNaN(id));

  const CHUNK_SIZE = 50;
  const chunks: number[][] = [];

  for (let i = 0; i < allIds.length; i += CHUNK_SIZE) {
    chunks.push(allIds.slice(i, i + CHUNK_SIZE));
  }

  const BATCH_SIZE = 5;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batchChunks = chunks.slice(i, i + BATCH_SIZE);
    let query = "query(";
    const variables: Record<string, number[]> = {};

    batchChunks.forEach((chunk, index) => {
      query += `$c${index}: [Int], `;
      variables[`c${index}`] = chunk;
    });

    query = query.slice(0, -2) + ") {\n";

    batchChunks.forEach((chunk, index) => {
      query += `  p${index}: Page(page: 1, perPage: 50) { 
        media(idMal_in: $c${index}, type: ANIME) { 
          id 
          idMal
          type
          title { english romaji native }
          coverImage { large }
          format
          status
          relations {
            edges {
              relationType(version: 2)
              node {
                id
                idMal
                type
                title { english romaji native }
                coverImage { large }
                format
                status
                relations {
                  edges {
                    relationType(version: 2)
                    node {
                      id
                      idMal
                      type
                      title { english romaji native }
                      coverImage { large }
                      format
                      status
                      relations {
                        edges {
                          relationType(version: 2)
                          node {
                            id
                            idMal
                            type
                            title { english romaji native }
                            coverImage { large }
                            format
                            status
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } 
      }\n`;
    });

    query += "}";

    try {
      const res = await fetch(ANILIST_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!res.ok) {
        console.error(`AniList API returned ${res.status}`);
        continue;
      }

      const data = await res.json();
      if (data.errors) {
        console.error("AniList API errors:", data.errors);
        continue;
      }

      if (data.data) {
        for (let j = 0; j < batchChunks.length; j++) {
          const page = data.data[`p${j}`];
          if (page && page.media) {
            for (const media of page.media) {
              processRelations(media, map, malIdToEntry);
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch enrichment data from AniList:", e);
    }
  }

  // Any MAL entries that weren't found in AniList get added with negative IDs
  const missingEntries = malIdToEntry.size;
  for (const [malId, entry] of malIdToEntry.entries()) {
    entry.id = -malId;
    map.set(entry.id, entry);
  }

  const finalGraphNodes = Array.from(map.values());
  const inLibraryNodes = finalGraphNodes.filter(n => n.inUserLibrary);

  console.log(`Imported entries: ${initialImportCount}`);
  console.log(`Graph nodes (in library): ${inLibraryNodes.length}`);
  console.log(`Missing nodes (AniList mapping failed): ${missingEntries}`);

  if (initialImportCount !== inLibraryNodes.length) {
    console.warn(`Discrepancy detected! ${initialImportCount} imported vs ${inLibraryNodes.length} mapped.`);
  }

  return finalGraphNodes;
}
