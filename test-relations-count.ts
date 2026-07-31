import { enrichMalRelations } from './src/services/malEnricher.js';

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
    }
  ];
  const result = await enrichMalRelations(malEntries as any);
  const aot = result.find(r => r.inUserLibrary);
  console.log("AOT relations count:", aot?.relations.length);
}
run();
