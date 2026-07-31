import { enrichMalRelations } from "./src/services/malEnricher.js";
import { buildFranchises } from "./src/services/franchise.js";

async function run() {
  const malEntries = [
    {
      id: 31964, // MHA
      title: "My Hero Academia",
      titles: { english: "My Hero Academia", romaji: null, native: null },
      coverImage: "",
      format: "TV" as any,
      status: "COMPLETED" as any,
      relations: [],
      inUserLibrary: true
    },
    {
      id: 33486, // MHA S2
      title: "My Hero Academia 2",
      titles: { english: "My Hero Academia 2", romaji: null, native: null },
      coverImage: "",
      format: "TV" as any,
      status: "COMPLETED" as any,
      relations: [],
      inUserLibrary: true
    }
  ];
  const enriched = await enrichMalRelations(malEntries as any);
  const franchises = buildFranchises(enriched);
  console.log("Franchises count:", franchises.length);
  franchises.forEach(f => {
    console.log(f.id, f.title);
    f.entries.forEach(e => console.log("  -", e.id, e.title));
  });
}
run();
