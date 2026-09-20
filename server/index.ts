import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";
import { migrateEmailVerification } from "./scripts/migrate-email-verification";
import { migrateNewsArticles } from "./scripts/migrate-news-articles";
import path from "path";

const app = express();
// Behind Northflank's TLS-terminating proxy: needed for secure cookies and correct IPs
app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Add specific route for PowerPoint files
app.get('/savyfunds-investor-pitch.pptx', (req, res) => {
  const filePath = path.resolve(import.meta.dirname, '../public/savyfunds-investor-pitch.pptx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
  res.setHeader('Content-Disposition', 'attachment; filename="savyfunds-investor-pitch.pptx"');
  res.sendFile(filePath);
});

// Add cache control middleware to prevent browser caching
app.use((req, res, next) => {
  // Set cache control headers to prevent caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  // Add timestamp to help with cache busting
  res.setHeader('X-App-Version', '2.0.2');
  res.setHeader('X-Timestamp', Date.now().toString());
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Run migration to add email verification columns
  await migrateEmailVerification();

  // Ensure the news_articles table exists (News section)
  await migrateNewsArticles();
  
  // Seed the database with initial demo data only when explicitly enabled.
  // Production starts with a clean database.
  if (process.env.SEED_DEMO_DATA === "true") {
    await seedDatabase();
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  // PORT env override lets PaaS hosts (Render etc.) assign the port.
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
