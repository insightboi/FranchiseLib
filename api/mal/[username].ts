import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    try {
        const { username } = req.query;
        if (!username || typeof username !== 'string' || username.trim() === "") {
            return res.status(400).json({ error: "Username is required" });
        }

        let allData: any[] = [];
        let offset = 0;
        const limit = 300;

        while (true) {
            const url = `https://myanimelist.net/animelist/${encodeURIComponent(username.trim())}/load.json?status=7&offset=${offset}`;
            const response = await fetch(url);

            if (!response.ok) {
                if (allData.length > 0) break; // If we got some data, just break on error. Otherwise fail.
                return res.status(response.status).json({ error: `MyAnimeList API error: ${response.statusText}` });
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                if (allData.length > 0) break;
                return res.status(502).json({ error: "Invalid response from MyAnimeList. The profile might be private or unavailable." });
            }

            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                break; // No more entries
            }

            allData = allData.concat(data);

            if (data.length < limit) {
                break; // Last page
            }

            offset += limit;
        }

        res.json(allData);
    } catch (error) {
        console.error("MAL API Proxy Error:", error);
        res.status(500).json({ error: "Internal server error while fetching MAL data" });
    }
}