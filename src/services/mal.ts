import { MalAnimeEntry } from "../types";

export class MalPublicProvider {
  private static readonly BASE_URL = "/api/mal";

  /**
   * Fetches a user's public anime library using the internal proxy endpoint.
   */
  static async fetchUserLibrary(userName: string): Promise<MalAnimeEntry[]> {
    if (!userName || userName.trim() === "") {
      throw new Error("Username is required.");
    }

    try {
      const url = `${this.BASE_URL}/${encodeURIComponent(userName.trim())}`;

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error("Invalid username or bad request.");
        } else if (response.status === 403) {
          throw new Error("Profile is private or access is forbidden.");
        } else if (response.status === 404) {
          throw new Error("User not found.");
        } else {
          let errorMsg = `Failed to fetch from MyAnimeList API. Status: ${response.status}`;
          try {
            const errData = await response.json();
            if (errData && errData.error) {
              errorMsg = errData.error;
            }
          } catch (e) {
            // ignore JSON parse error
          }
          throw new Error(errorMsg);
        }
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          "Invalid response from MyAnimeList. The profile might be private or unavailable.",
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid data format received from MyAnimeList.");
      }

      if (data.length === 0) {
        throw new Error("Library is empty or contains no valid entries.");
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`MyAnimeList Import Error: ${error.message}`);
      }
      throw new Error(
        "An unknown error occurred while fetching from MyAnimeList.",
      );
    }
  }
}
