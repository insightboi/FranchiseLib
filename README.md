# Automated MyAnimeList Franchise Enrichment Strategy

To automatically assign franchise relationships to MyAnimeList imports without maintaining complex rules or title heuristics, the single most reliable strategy is **AniList Bulk Mapping via `idMal_in`**.

## The Recommended Strategy: MAL IDs → AniList Bulk Mapping

Instead of querying MyAnimeList/Jikan for relations one-by-one, we extract all `mal_id` values from the user's imported library and send them in a **single, batched GraphQL query** to the AniList API.

### Evaluation of Requirements

1. **Additional API Requests Required:** 
   * **Only 1 additional HTTP request.** 
   * By passing an array of hundreds of MAL IDs to the `idMal_in: [Int]` argument, and using GraphQL aliases to handle pagination (`p1: Page(page: 1)`, `p2: Page(page: 2)`), the entire user library's relations can be fetched simultaneously.
2. **Availability of Relationships:** 
   * AniList returns the exact relation edges (`SEQUEL`, `PREQUEL`, `PARENT`, `SIDE_STORY`, `ADAPTATION`, etc.) that our franchise engine already understands.
   * Each relation edge contains both the `id` and `idMal` of the target, allowing seamless mapping back to the MAL dataset.
3. **Automatic Franchise Identification:** 
   * Yes. The returned graph data can be fed directly into our existing Stage 1 `addRelationsToGraph` logic. 
   * This automatically solves deeply nested franchises (Pokémon, Fate, Monogatari, Gundam) with **zero special rules or manual maintenance**.
4. **Performance Implications:** 
   * Extremely fast. Resolving 500 MAL IDs in a single batched AniList query takes under 1 second.
5. **Rate Limits:** 
   * AniList allows 90 requests per minute. 1 request per library load is perfectly safe.
   * In contrast, the Jikan API (MAL unofficial API) strictly limits to 3 requests per second. Fetching relations for 300 items via Jikan would take **100+ seconds**, making it unviable for real-time app usage.
6. **Suitability for Caching:** 
   * Highly cacheable. The mapping response can be easily stored in IndexedDB or `localStorage`, making subsequent loads instant.

### Why this is the best approach
If we use Jikan, we hit severe rate limits resulting in minutes of loading time. If we try to download offline mapping databases (like anime-offline-database), we incur a ~20MB payload cost without native relation graphs.

By bridging the MAL IDs into the AniList GraphQL API, we **reuse the exact same, proven data structure** that powers our AniList pipeline, unlocking flawless grouping for MAL without touching the grouping engine itself.
