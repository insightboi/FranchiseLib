import { enrichMalRelations } from "./src/services/malEnricher";
import { NormalizedAnime } from "./src/types";

// Mock the global fetch function
global.fetch = jest.fn();

describe("enrichMalRelations", () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    (global.fetch as jest.Mock).mockClear();
  });

  it("should throw an error when the AniList API fails", async () => {
    // Arrange
    const entries: NormalizedAnime[] = [
      {
        id: 1,
        title: "Test Anime",
        titles: {
            english: "Test Anime",
            romaji: "Test Anime",
            native: "Test Anime",
        },
        coverImage: "",
        format: "TV",
        status: "COMPLETED",
        relations: [],
        inUserLibrary: true,
        originalProviderData: null,
      },
    ];

    // Mock the fetch call to simulate a network error
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    // Act & Assert
    await expect(enrichMalRelations(entries)).rejects.toThrow("Network error");
  });
});
