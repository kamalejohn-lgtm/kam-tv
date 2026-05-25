import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  // Standard port as per environment configuration
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
  // Render health checking
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "kamtv-standalone" });
  });

  // Enable Vite middleware in dev or fall back to compiled assets in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Safe wildcard routing syntax for Express 5 matching compatibility
    app.get('/:splat*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`KamTV server successfully running on port ${PORT}`);
  });
}

startServer();