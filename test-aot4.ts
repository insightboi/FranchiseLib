const ANILIST_API_URL = "https://graphql.anilist.co";
async function run() {
  const query = `query {
    Media(idMal: 16498, type: ANIME) {
      id
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
  }`;
  const res = await fetch(ANILIST_API_URL, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });
  console.log(JSON.stringify(await res.json(), null, 2));
}
run();
