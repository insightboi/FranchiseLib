import {
  Franchise,
  FranchiseEntry,
  AniListTitle,
  NormalizedAnime,
} from "../types";


const VALID_FRANCHISE_RELATIONS = new Set([
  "ADAPTATION",
  "PREQUEL",
  "SEQUEL",
  "PARENT",
  "SIDE_STORY",
  "SPIN_OFF",
  "ALTERNATIVE",
  "SUMMARY",
  "COMPILATION",
]);

const GENERIC_STOP_WORDS = new Set([
  "movie",
  "special",
  "ova",
  "ona",
  "the",
  "anime",
  "series",
  "version",
  "part",
  "season",
  "tv",
]);

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics/accents (e.g. Pokémon -> pokemon)
    .replace(/\(.*?\)/g, "") // remove parenthetical year/format notes e.g. (2019)
    .replace(/\[.*?\]/g, "") // remove bracketed notes
    .replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9faf\s]/g, " ") // retain alphanumeric and CJK
    .replace(/\s+/g, " ")
    .trim();
}

function extractPrefixesFromRawString(raw: any): string[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  const results: string[] = [];

  const fullNormalized = normalizeText(raw);
  if (fullNormalized.length >= 3 && !GENERIC_STOP_WORDS.has(fullNormalized)) {
    results.push(fullNormalized);
  }

  // Split by common title delimiters: ':', '-', '—', '~', '/'
  const delimiterRegex = /[:\-\u2014~\/]/;
  const parts = raw.split(delimiterRegex);
  if (parts.length > 1 && parts[0].trim()) {
    const prefixNormalized = normalizeText(parts[0]);
    if (
      prefixNormalized.length >= 3 &&
      !GENERIC_STOP_WORDS.has(prefixNormalized)
    ) {
      results.push(prefixNormalized);
    }
  }

  return results;
}

function getCanonicalKeysForEntry(titleObj?: AniListTitle): Set<string> {
  const keys = new Set<string>();
  if (!titleObj) return keys;

  const engPrefixes = extractPrefixesFromRawString(titleObj.english);
  const romPrefixes = extractPrefixesFromRawString(titleObj.romaji);
  const natPrefixes = extractPrefixesFromRawString(titleObj.native);

  for (const k of [...engPrefixes, ...romPrefixes, ...natPrefixes]) {
    keys.add(k);
  }

  return keys;
}

/**
 * STAGE 2 RECONCILIATION LAYER:
 *
 * Why this layer exists:
 * AniList's relation graph is occasionally incomplete or classifies legitimate structural links
 * between major series installments (such as disconnected generations of Pokémon / Pocket Monsters)
 * under the relation type 'OTHER'. Enabling 'OTHER' globally in Stage 1 causes severe regressions
 * by merging completely unrelated franchises (e.g. via crossover specials, staff credits, or
 * shared universe tags).
 *
 * To solve disconnected components for large franchises without relaxing Stage 1 relation filters or
 * enabling 'OTHER', Stage 2 performs a generic, ultra-conservative reconciliation pass. It inspects
 * disconnected Stage 1 components and merges them ONLY when there is overwhelming, exact evidence
 * that they share identical canonical franchise prefixes across English, Romaji, or Native titles.
 */
function reconcileFranchises(
  stage1Franchises: Franchise[],
  mediaTitlesMap: Map<number, AniListTitle>,
): Franchise[] {
  if (stage1Franchises.length <= 1) return stage1Franchises;

  // Extract canonical keys for each component
  const componentKeysMap = stage1Franchises.map((franchise) => {
    const keys = new Set<string>();
    for (const entry of franchise.entries) {
      const titles = mediaTitlesMap.get(entry.id);
      const entryKeys = getCanonicalKeysForEntry(titles);
      for (const k of entryKeys) {
        keys.add(k);
      }
    }
    return keys;
  });

  // Union-Find (DSU) structure to group components
  const parent = stage1Franchises.map((_, i) => i);
  function find(i: number): number {
    if (parent[i] === i) return i;
    return (parent[i] = find(parent[i]));
  }
  function union(i: number, j: number) {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      parent[rootI] = rootJ;
    }
  }

  // Compare components pairwise for shared canonical keys
  for (let i = 0; i < stage1Franchises.length; i++) {
    for (let j = i + 1; j < stage1Franchises.length; j++) {
      const keysI = componentKeysMap[i];
      const keysJ = componentKeysMap[j];

      let hasMatchingCanonicalKey = false;
      for (const keyI of keysI) {
        if (keysJ.has(keyI)) {
          hasMatchingCanonicalKey = true;
          break;
        }
      }

      if (hasMatchingCanonicalKey) {
        union(i, j);
      }
    }
  }

  // Group components by DSU root
  const groupsMap = new Map<number, Franchise[]>();
  for (let i = 0; i < stage1Franchises.length; i++) {
    const root = find(i);
    if (!groupsMap.has(root)) {
      groupsMap.set(root, []);
    }
    groupsMap.get(root)!.push(stage1Franchises[i]);
  }

  // Rebuild final franchises
  const finalFranchises: Franchise[] = [];
  let idCounter = 0;

  for (const [, components] of groupsMap) {
    if (components.length === 1) {
      finalFranchises.push({
        ...components[0],
        id: `franchise-${idCounter++}`,
      });
    } else {
      // Merge entries across all components in the group
      const entryMap = new Map<number, FranchiseEntry>();
      for (const comp of components) {
        for (const entry of comp.entries) {
          entryMap.set(entry.id, entry);
        }
      }

      const mergedEntries = Array.from(entryMap.values());
      mergedEntries.sort((a, b) => a.id - b.id); // Sort by ID (proxy for release order)

      const representative = mergedEntries[0];

      finalFranchises.push({
        id: `franchise-${idCounter++}`,
        title: representative.title,
        coverImage: representative.coverImage,
        entries: mergedEntries,
      });
    }
  }

  // Sort franchises alphabetically by representative title
  finalFranchises.sort((a, b) => a.title.localeCompare(b.title));

  return finalFranchises;
}

function addRelationsToGraph(
  node: NormalizedAnime,
  adjList: Map<number, Set<number>>,
  normalizedMap: Map<number, NormalizedAnime>,
) {
  if (!adjList.has(node.id)) {
    adjList.set(node.id, new Set());
  }

  for (const relation of node.relations) {
    if (VALID_FRANCHISE_RELATIONS.has(relation.relationType)) {
      const targetId = relation.targetId;
      if (!adjList.has(targetId)) {
        adjList.set(targetId, new Set());
      }
      adjList.get(node.id)!.add(targetId);
      adjList.get(targetId)!.add(node.id);
    }
  }
}

function buildFranchises(normalizedData: NormalizedAnime[]): Franchise[] {
  if (!normalizedData || normalizedData.length === 0) return [];

  const userMediaMap = new Map<number, FranchiseEntry>();
  const mediaTitlesMap = new Map<number, AniListTitle>();
  const adjList = new Map<number, Set<number>>();

  // 1. Process entries and build nodes & edges (Stage 1)
  const allNodesMap = new Map<number, NormalizedAnime>();
  normalizedData.forEach((entry) => allNodesMap.set(entry.id, entry));

  normalizedData.forEach((entry) => {
    // If it's in the user's library, track it
    if (entry.inUserLibrary) {
      userMediaMap.set(entry.id, entry);
    }

    mediaTitlesMap.set(entry.id, {
      english: entry.titles.english,
      romaji: entry.titles.romaji,
      native: entry.titles.native,
    });

    addRelationsToGraph(entry, adjList, allNodesMap);
  });

  // Ensure isolated nodes in the user's library have an adjList entry
  for (const id of userMediaMap.keys()) {
    if (!adjList.has(id)) {
      adjList.set(id, new Set());
    }
  }

  // 2. Find connected components using BFS/DFS (Stage 1)
  const visited = new Set<number>();
  const stage1Franchises: Franchise[] = [];
  let franchiseIdCounter = 0;

  for (const [nodeId] of adjList) {
    if (!visited.has(nodeId)) {
      const componentIds = new Set<number>();
      const queue = [nodeId];
      visited.add(nodeId);

      while (queue.length > 0) {
        const current = queue.shift()!;
        componentIds.add(current);

        const neighbors = adjList.get(current);
        if (neighbors) {
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          }
        }
      }

      // Filter component nodes to only include those in user's list
      const franchiseEntries: FranchiseEntry[] = [];
      for (const id of componentIds) {
        if (userMediaMap.has(id)) {
          franchiseEntries.push(userMediaMap.get(id)!);
        }
      }

      if (franchiseEntries.length > 0) {
        // Sort entries by ID (proxy for release order/age)
        franchiseEntries.sort((a, b) => a.id - b.id);

        // Representative entry for the franchise (usually the oldest)
        const representative = franchiseEntries[0];

        stage1Franchises.push({
          id: `franchise-${franchiseIdCounter++}`,
          title: representative.title,
          coverImage: representative.coverImage,
          entries: franchiseEntries,
        });
      }
    }
  }

  // 3. Stage 2 Reconciliation Pass
  return reconcileFranchises(stage1Franchises, mediaTitlesMap);
}

export { buildFranchises };
