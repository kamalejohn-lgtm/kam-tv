import express from "express";
import path from "path";

async function startServer() {
  const app = express();
  // Standard port as per environment configuration
  const PORT = process.env.PORT || 3000;

  // Render health checking
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "kamtv-standalone" });
  });

  // Enable Vite middleware in dev or fall back to compiled assets in production
  const isProduction = 
    process.env.NODE_ENV === "production" || 
    process.argv[1]?.endsWith("server.cjs") || 
    process.argv[1]?.includes("dist");

  // Flat Condition 1: Development Mode
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  // Flat Condition 2: Production Mode (No else block!)
  if (isProduction) {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*all', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`KamTV server successfully running on port ${PORT}`);
  });
}

startServer();
