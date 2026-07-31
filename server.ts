import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API route for MAL proxy
  app.get("/api/mal/:username", async (req, res) => {
    try {
      const { username } = req.params;
      if (!username || username.trim() === "") {
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
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
