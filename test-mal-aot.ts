import { fetchUserAnimeList } from "./src/services/anilist.js";
import { enrichMalRelations } from "./src/services/malEnricher.js";

async function run() {
  const malEntries = [
    {
      id: 16498,
      title: "Attack on Titan",
      titles: { english: "Attack on Titan", romaji: null, native: null },
      coverImage: "",
      format: "TV" as any,
      status: "COMPLETED" as any,
      relations: [],
      inUserLibrary: true
    },
    {
      id: 25777,
      title: "Attack on Titan Season 2",
      titles: { english: "Attack on Titan S2", romaji: null, native: null },
      coverImage: "",
      format: "TV" as any,
      status: "COMPLETED" as any,
      relations: [],
      inUserLibrary: true
    }
  ];
  const result = await enrichMalRelations(malEntries as any);
  console.log(`Input length: ${malEntries.length}, Output length: ${result.filter(r => r.inUserLibrary).length}`);
  result.filter(r => r.inUserLibrary).forEach(r => console.log(r.id, r.title));
}
run();
