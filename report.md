# Objective
Determine why AniList and MyAnimeList still diverge internally even though both ultimately produce `NormalizedAnime[]`. The objective is that every component after normalization becomes completely provider-agnostic.

# Pipeline Analysis

## AniList Import
- **Inputs**: User's AniList username.
- **Outputs**: Raw AniList API response containing lists of user entries (with status and progress) and their associated media (including titles, format, and pre-populated relation edges).
- **Mutations/Cached Values**: None. Purely data fetching.
- **Provider-specific behaviour**: Executes a complex GraphQL query to fetch the user's library and a single depth layer of graph relations in one network request.
- **Assumptions**: Assumes the user exists and the profile is public.

## AniList Normalizer
- **Inputs**: Raw `AniListResponse`.
- **Outputs**: `NormalizedAnime[]` containing the full relation graph of all visible items.
- **Mutations**: Flattens nested nodes using `normalizedMap` (Map<number, NormalizedAnime>) to prevent duplication.
- **Provider-specific behaviour**: 
  - Extracts `progress` and maps it to `episodesWatched`.
  - Maps `entry.status` to `status` enum (`CURRENT`, `COMPLETED`, `PAUSED`, `DROPPED`, `PLANNING`).
  - Iterates over graph edges inside the response and recursively parses relation nodes.
- **Cached values**: Uses an internal `normalizedMap` during graph traversal to ensure unique nodes.

## AniList Relation Graph (Built-in)
- **Inputs**: Embedded inside the GraphQL response from AniList.
- **Outputs**: Handled directly by `processRelations` inside the AniList Normalizer.
- **Assumptions**: Assumes all relationships needed to build franchises are provided within the immediate edges of items in the user's library.

## Franchise Engine (`buildFranchises`)
- **Inputs**: `NormalizedAnime[]` (provider-agnostic).
- **Outputs**: `Franchise[]` (grouped and reconciled umbrella objects).
- **Mutations**: Builds an Adjacency List (`adjList`), executes BFS to extract connected components, and then performs a Stage-2 Union-Find title reconciliation.
- **Provider-specific behaviour**: **None**. Operates strictly on the normalized generic schema.
- **Assumptions**: Assumes all relevant nodes (even those not in the user's library) exist in the provided array.

## Dashboard (AniList)
- **Inputs**: `Franchise[]`, user visibility toggles, text search query.
- **Outputs**: Rendered React UI.
- **Provider-specific behaviour**: Minimal. UI text headers and provider switch toggles in `App.tsx` conditionally render text based on the active provider. Statistics and filtering operate identically across providers.

---

## MAL Import
- **Inputs**: User's MAL username.
- **Outputs**: Array of `MalAnimeEntry`.
- **Provider-specific behaviour**:
  - Fetches from a custom internal proxy `/api/mal`.
  - **Explicitly strips out Planning entries (`status === 6`) prior to normalization.** This is a critical divergence from AniList.
  - Returns completely flat data. Contains no relation graph.

## MAL Normalizer
- **Inputs**: `MalAnimeEntry[]`.
- **Outputs**: `NormalizedAnime[]`.
- **Provider-specific behaviour**:
  - Maps `num_watched_episodes` to `episodesWatched`.
  - Synthesizes `url` string because MAL API only provides relative paths.
  - Adds fields entirely missing from AniList normalizer: `userScore`, `totalEpisodes`, `genres`, `startDate`, `endDate`.
  - Sets `relations: []` for all items.

## MAL Relation Enrichment (`enrichMalRelations`)
- **Inputs**: Flat `NormalizedAnime[]` (missing relations).
- **Outputs**: Enriched `NormalizedAnime[]` (graph fully populated).
- **Mutations**: Modifies `NormalizedAnime` instances to populate the `relations` arrays and injects newly discovered relation nodes (with `inUserLibrary: false`).
- **Provider-specific behaviour**: 
  - Batches MAL IDs (by matching `idMal`) and queries the AniList GraphQL API to fetch the missing relation edges.
  - Groups queries into chunks of 50 IDs, maximum 10 chunks per batch, to bypass GraphQL complexity limits.
  - Maps `idMal` to normal `id` to ensure compatibility with the Franchise Engine.
- **Duplicated logic**: Duplicates the graph traversal logic (`processRelations`) found in the `anilistNormalizer`.

## Dashboard (MAL)
- Functions identically to AniList Dashboard.

---

# Provider-Specific Branches

Occurrences of conditional checks for providers (e.g., `provider === "anilist"` or `isMal`):

1. **`src/hooks/useAnimeLibrary.ts` (Lines 29-39):**
   - Direct switch: `if (provider === "myanimelist") { ... } else { ... }`.
   - Controls which API service, normalizer, and enrichment pipeline to execute.
2. **`src/App.tsx` (Line 190):**
   - Conditional text: `{provider === "anilist" ? "AniList Import" : "MyAnimeList Import"}`
3. **`src/App.tsx` (Line 194):**
   - Conditional instructions text based on active provider.
4. **`src/App.tsx` (Lines 203 & 210):**
   - Styling logic for the provider toggle buttons.
5. **`src/App.tsx` (Line 221):**
   - Input placeholder: `provider === "anilist" ? "AniList Username" : "MyAnimeList Username"`
6. **`src/services/mal.ts` (Lines 59-64):**
   - *Indirect Branching / Divergent Logic*: MAL explicitly strips `status === 6` (Planning). The AniList pipeline retains it.
7. **`src/services/malNormalizer.ts` (Lines 50-67):**
   - *Indirect Branching*: Synthesizes `url`, `userScore`, `totalEpisodes`, `genres`, `startDate`, `endDate` fields that AniList does not populate.
8. **`src/services/malEnricher.ts` (Line 5):**
   - *Duplicated logic*: Re-implements `processRelations` uniquely for MAL.

---

# NormalizedAnime Schema Audit

The `NormalizedAnime` contract is defined in `src/types.ts`:

- `id` (number): Always populated by both.
- `title` (string): Always populated by both. Computed fallback if titles missing.
- `titles` (AniListTitle): Populated by both.
- `coverImage` (string): Always populated by both.
- `format` (MediaFormat): Populated by both via provider-specific mappers.
- `status` (MediaStatus | null): Populated by both.
- `relations` (AnimeRelation[]): 
  - AniList: Always populated during normalization.
  - MAL: Synthesized exclusively during the `enrichMalRelations` pass (post-normalization).
- `inUserLibrary` (boolean): Always populated by both.
- `originalProviderData` (any): Populated by both, but shape completely differs depending on provider.
- `episodesWatched` (number?): Populated by both (`progress` vs `num_watched_episodes`).
- `url` (string?): **Always populated by MAL. Never by AniList.**
- `userScore` (number?): **Always populated by MAL. Never by AniList.**
- `totalEpisodes` (number?): **Always populated by MAL. Never by AniList.**
- `genres` (string[]?): **Always populated by MAL. Never by AniList.**
- `startDate` (string?): **Always populated by MAL. Never by AniList.**
- `endDate` (string?): **Always populated by MAL. Never by AniList.**

**Inconsistencies:** The `NormalizedAnime` object is significantly heavier when generated by MAL. Six properties are completely unused by the application because AniList does not provide them, meaning UI components cannot safely rely on them.

---

# Dashboard Audit

- **Counters**: Operates exclusively on `Visible NormalizedAnime[]`.
- **Filters/Visibility**: `filterVisibleEntries` operates exclusively on `NormalizedAnime[]`.
- **Search**: Scans `visibleFranchises` using standard array methods. Provider-agnostic.
- **Grouping**: Uses the `buildFranchises` engine which consumes `NormalizedAnime[]`. Provider-agnostic.
- **Sorting**: Handled automatically in `buildFranchises`.

**Conclusion**: ZERO direct provider dependency remains in the UI or Dashboard components. They strictly consume `Franchise[]` and `NormalizedAnime[]`.

---

# Statistics Audit

- **Data Source**: Exclusively derived from `visibleFranchises` (the array of `Franchises` post-visibility filtering).
- **Where Computed**: Inside `App.tsx` via the `stats` `useMemo` hook.
- **Visible Filtering**: Consumes the output of the `useMemo` block that runs `filterVisibleEntries`.
- **Provider Dependence**: **None.** All stats evaluate standard `status` strings (`COMPLETED`, `CURRENT`, `PAUSED`, `DROPPED`, `PLANNING`) and `episodesWatched`.
- **Duplicated Calculations**: None. The pipeline iterates over `visibleFranchises` in a single pass to compute all metrics.

---

# Relation Audit

**Do AniList and MAL produce an identical graph topology?**
**No.** 
- **AniList**: The GraphQL query (`fetchUserAnimeList`) pulls relationships *only for entries in the user's library* and depth-1 edges originating directly from them. If two user items are connected via a third item *not* in the user's library, and that third item wasn't fetched as an edge, they might not connect.
- **MAL**: The `enrichMalRelations` pass fetches the relation graph for all user entries *by matching `idMal`*. However, because the AniList database updates dynamically, and `idMal` mapping is sometimes delayed or incomplete on the AniList backend, a small percentage of MAL entries will silently fail to pull their relation edges, resulting in orphaned franchises compared to the native AniList fetch.
- **Implementation Divergence**: `anilistNormalizer` maps graph edges directly from the initial nested GraphQL payload. `malEnricher` sends batched page requests by `idMal` and re-implements `processRelations`.

---

# Performance Audit

**Optimization Opportunities:**
1. **Duplicate Graph Building Logic:** `anilistNormalizer` and `malEnricher` both independently traverse GraphQL relation edges to construct nodes.
2. **Repeated Filtering:** In `App.tsx`, `visibleFranchises` creates new object references using `.map` and `.filter` on every render if `franchises` or `visibility` changes. `filteredFranchises` then filters `visibleFranchises` again for text search.
3. **Graph Traversal Duplication:** The DSU algorithm inside `reconcileFranchises` compares every franchise against every other franchise (O(N^2) component comparison), which can become computationally expensive for very large lists.
4. **Multiple Passes:** AniList normalization executes two loops over the collection (first pass for nodes, second pass for user statuses).

---

# Future Compatibility

Would adding **Kitsu**, **Anime-Planet**, or **MangaDex** require changes outside Providers/Normalizers?
**Yes.**

**Why?**
1. **Enrichment Coupling**: `useAnimeLibrary.ts` hardcodes the pipeline sequence (`fetch -> normalize -> enrich -> build`). A new provider lacking relations (like Kitsu) would require a custom enricher, requiring a new branch in the `loadLibrary` hook.
2. **Relation Graph Dependency**: The Franchise Engine relies on AniList's specific `relationType` enum (`ADAPTATION`, `PREQUEL`, etc.) in `VALID_FRANCHISE_RELATIONS`. If Kitsu provides relationships with different nomenclature, it will silently fail unless a standardized `RelationType` enum is enforced globally and mappers are created.
3. **ID Namespace Collisions**: The Franchise engine assumes `entry.id` is globally unique. AniList IDs and MAL IDs currently don't overlap dangerously due to `malEnricher` using the AniList ID as the root ID. Adding a new provider without a unified ID reconciliation layer will cause graph collisions (e.g., Kitsu ID `123` merging with AniList ID `123`).

---

# Final Report

### 1. Architecture Score
**7.5 / 10**
The core UI and Franchise Engine are successfully decoupled from the raw APIs, but the data enrichment layer is heavily coupled to AniList's graph topology and MAL handles data loss (Planning entries) before normalization.

### 2. Remaining Technical Debt (Priority Order)
1. **MAL Data Loss**: `mal.ts` explicitly strips out `status === 6` (Planning). The normalizer never sees them, creating an unavoidable inconsistency.
2. **Missing Abstraction Layer for Enrichment**: `malEnricher.ts` is explicitly called inside the React hook `loadLibrary`. There is no generic interface for "Relation Enrichment".
3. **Leaky Schema**: `NormalizedAnime` contains 6 MAL-exclusive properties that AniList cannot fulfill, bloating the interface.
4. **ID Namespace Coupling**: Franchise Engine assumes all IDs are AniList IDs. `malEnricher` translates MAL IDs to AniList IDs to make it work.
5. **O(N^2) Reconciliation**: The title reconciliation step is unoptimized for enormous libraries.

### 3. Provider Parity Score
**High (Approx. 85%)**
AniList and MAL now expose identical statistics (`episodesWatched`, statuses) and utilize the exact same UI components and franchise engine. The remaining 15% gap is caused by MAL's missing Planning entries, MAL-exclusive metadata fields in the schema, and the differing methods used to fetch the relation graph (built-in vs. batched enrichment).

### 4. Recommended Implementation Roadmap
1. Modify `src/services/mal.ts` to retain `status === 6` (Plan to Watch) items so they reach the Normalizer.
2. Strip MAL-exclusive properties (`url`, `userScore`, `genres`, etc.) from the `NormalizedAnime` interface to enforce strict parity.
3. Abstract `enrichMalRelations` into a generic `RelationEnricher` interface that any non-AniList provider can utilize.
4. Create a unified ID namespace (e.g., prefixing IDs like `al:123` and `mal:456`) and resolve relations using external cross-reference mappings.
5. Consolidate `processRelations` from both normalizers into a single shared graph-building utility.
6. Optimize `reconcileFranchises` to map canonical keys to components directly instead of O(N^2) pairwise comparisons.
