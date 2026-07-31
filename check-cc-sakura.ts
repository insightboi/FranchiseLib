import fs from 'fs';
const ANILIST_API_URL = "https://graphql.anilist.co";
async function queryEdge(title: string, targetTitle: string) {
  const query = `query($search: String) {
    Media(search: $search, type: ANIME) {
      relations { edges { relationType node { title { english romaji } } } }
    }
  }`;
  const res = await fetch(ANILIST_API_URL, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { search: title } })
  });
  const json = await res.json();
  const edges = json.data.Media.relations.edges.filter((e:any) => 
     (e.node.title.english && e.node.title.english.includes(targetTitle)) || 
     (e.node.title.romaji && e.node.title.romaji.includes(targetTitle))
  );
  return edges.map((e:any) => e.relationType);
}
async function run() {
  console.log("Tsubasa -> CCS:", await queryEdge("Tsubasa RESERVoir", "Cardcaptor Sakura"));
  console.log("CCS -> Tsubasa:", await queryEdge("Cardcaptor Sakura", "Tsubasa RESERVoir"));
}
run();
