# MyAnimeList Public Provider (MalPublicProvider)

## Overview

The `MalPublicProvider` is a data ingestion service responsible for fetching a user's public anime library from MyAnimeList (MAL) using the official `load.json` endpoint. 

This provider acts as an isolated extraction layer. It handles network communication, response validation, JSON parsing, and domain-specific filtering without leaking its implementation details to the broader application.

## Responsibilities

* **Data Fetching:** Communicates directly with the `https://myanimelist.net/animelist/{username}/load.json` endpoint.
* **Validation & Error Handling:** Gracefully handles invalid usernames, private profiles, network failures, and empty libraries by throwing structured, human-readable errors.
* **Progress Mode Filtering:** Pre-filters the returned data before handing it off to the application. It explicitly removes "Plan to Watch" items (status `6`) and strictly includes only anime that the user has actually started:
  * Watching (status `1`)
  * Completed (status `2`)
  * On Hold (status `3`)
  * Dropped (status `4`)
* **Status Preservation:** Retains the original MAL status integer on every returned entry.

## Data Flow

1. **Invocation:** The application calls `MalPublicProvider.fetchUserLibrary(userName)`.
2. **Request:** The provider queries the internal API endpoint `/api/mal/{username}`.
3. **Proxy:** The Express backend fetches from `https://myanimelist.net/animelist/{username}/load.json?status=0&offset=0` to bypass CORS.
4. **Validation:** HTTP statuses are checked (e.g., 400 for Bad Request, 403 for Private, 404 for Not Found). 
5. **Parsing:** The response is parsed into JSON and verified as an array.
6. **Filtering:** The array is passed through the Progress Mode filter, stripping out any item not in the `[1, 2, 3, 4]` status set.
7. **Return:** An array of `MalAnimeEntry` objects is returned to the caller.

## Architecture & Integration

The provider is intentionally designed as an isolated leaf node in the Import Layer:

```
Import Layer
      │
      ├── AniList Provider
      └── MalPublicProvider
```

**Constraints:**
* **No Normalization:** The provider returns raw (but filtered) `MalAnimeEntry` objects. It is not responsible for transforming this data into the standard `FranchiseEntry` format.
* **Engine Isolation:** The existing Franchise Engine and `AniList` implementations remain completely unaware of this provider. Normalization and integration into the Franchise Engine will be handled by a separate abstraction layer in a future milestone.
