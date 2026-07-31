import { enrichMalRelations } from "./src/services/malEnricher.js";
import { buildFranchises } from "./src/services/franchise.js";

async function run() {
  const malEntries = [
    {
      id: 52034, // Oshi no Ko
      title: "Oshi no Ko",
      titles: { english: "Oshi no Ko", romaji: null, native: null },
      coverImage: "",
      format: "TV" as any,
      status: "COMPLETED" as any,
      relations: [],
      inUserLibrary: true
    },
    {
      id: 55791, // Oshi no Ko S2
      title: "Oshi no Ko 2",
      titles: { english: "Oshi no Ko 2", romaji: null, native: null },
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
