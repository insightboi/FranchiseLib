import { AniListResponse, Franchise, FranchiseEntry } from "../types";

const ANILIST_API_URL = "https://graphql.anilist.co";

const USER_LIST_QUERY = `
  query ($userName: String) {
    MediaListCollection(userName: $userName, type: ANIME) {
      lists {
        name
        entries {
          status
          progress
          media {
            id
            title {
              english
              romaji
              native
            }
            coverImage {
              large
            }
            format
            relations {
              edges {
                relationType(version: 2)
                node {
                  id
                  type
                  relations {
                    edges {
                      relationType(version: 2)
                      node {
                        id
                        type
                        relations {
                          edges {
                            relationType(version: 2)
                            node {
                              id
                              type
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
        }
      }
    }
  }
`;

export async function fetchUserAnimeList(
  userName: string,
): Promise<AniListResponse> {
  const response = await fetch(ANILIST_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: USER_LIST_QUERY,
      variables: { userName },
    }),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("User not found.");
    }
    throw new Error("Failed to fetch from AniList API.");
  }

  const json = await response.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].message);
  }

  return json;
}
