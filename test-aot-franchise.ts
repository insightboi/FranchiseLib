import { enrichMalRelations } from "./src/services/malEnricher.js";
import { buildFranchises } from "./src/services/franchise.js";

async function run() {
  const malEntries = [
    {
      id: 16498, // AOT
      title: "Attack on Titan",
      titles: { english: "Attack on Titan", romaji: null, native: null },
      coverImage: "",
      format: "TV" as any,
      status: "COMPLETED" as any,
      relations: [],
      inUserLibrary: true
    },
    {
      id: 25777, // AOT S2
      title: "Attack on Titan Season 2",
      titles: { english: "Attack on Titan S2", romaji: null, native: null },
      coverImage: "",
      format: "TV" as any,
      status: "COMPLETED" as any,
      relations: [],
      inUserLibrary: true
    },
    {
      id: 35760, // AOT S3
      title: "Attack on Titan Season 3",
      titles: { english: "Attack on Titan S3", romaji: null, native: null },
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
