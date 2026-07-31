import { useState, useCallback } from "react";
import { fetchUserAnimeList } from "../services/anilist";
import { normalizeAniList } from "../services/anilistNormalizer";
import { MalPublicProvider } from "../services/mal";
import { normalizeMal } from "../services/malNormalizer";
import { enrichMalRelations } from "../services/malEnricher";
import { buildFranchises } from "../services/franchise";
import { Franchise } from "../types";

export type ProviderType = "anilist" | "myanimelist";

export function useAnimeLibrary() {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLibrary = useCallback(
    async (userName: string, provider: ProviderType) => {
      if (!userName.trim()) {
        setError("Please enter a username.");
        return;
      }

      setIsLoading(true);
      setError(null);
      setFranchises([]);

      try {
        if (provider === "myanimelist") {
          const rawMalData = await MalPublicProvider.fetchUserLibrary(userName);
          const normalizedData = normalizeMal(rawMalData);
          const enrichedData = await enrichMalRelations(normalizedData);
          const grouped = buildFranchises(enrichedData);
          setFranchises(grouped);
        } else {
          const data = await fetchUserAnimeList(userName);
          const normalizedData = normalizeAniList(data);
          const grouped = buildFranchises(normalizedData);
          setFranchises(grouped);
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching data.");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const resetLibrary = useCallback(() => {
    setFranchises([]);
    setError(null);
  }, []);

  return {
    franchises,
    isLoading,
    error,
    loadLibrary,
    resetLibrary,
  };
}
