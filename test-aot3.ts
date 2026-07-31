const ANILIST_API_URL = "https://graphql.anilist.co";
async function run() {
  const query = `query {
    Media(idMal: 35760, type: ANIME) {
      id
      idMal
      title { english romaji }
      relations {
        edges {
          relationType(version: 2)
          node {
            id
            idMal
            title { english romaji }
          }
        }
      }
    }
  }`;
  const res = await fetch(ANILIST_API_URL, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });
  console.log(JSON.stringify(await res.json(), null, 2));
}
run();
