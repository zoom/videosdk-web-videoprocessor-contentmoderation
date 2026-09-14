import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import KJUR from "jsrsasign";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const distPath = path.join(rootDir, "dist");
const isDev = process.env.NODE_ENV !== "production";

const sdkKey = process.env.SDK_KEY as string;
const sdkSecret = process.env.SDK_SECRET as string;
const PORT = process.env.PORT || 3001;

// You should sign your JWT with a backend service in a production use-case
function generateSignature(sessionName: string, role: number) {
  const iat = Math.round(new Date().getTime() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;
  const oHeader = { alg: "HS256", typ: "JWT" };

  const oPayload = {
    app_key: sdkKey,
    tpc: sessionName,
    role_type: role,
    version: 1,
    iat: iat,
    exp: exp,
  };

  const sHeader = JSON.stringify(oHeader);
  const sPayload = JSON.stringify(oPayload);
  const sdkJWT = KJUR.KJUR.jws.JWS.sign("HS256", sHeader, sPayload, sdkSecret);
  return sdkJWT;
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/config", (_req, res) => {
  res.json({ endpointUrl: process.env.ENDPOINT_URL ?? null });
});

app.post("/zoomtoken", (req, res) => {
  if (!sdkKey || !sdkSecret) {
    res.status(500).json({ error: "SDK_KEY or SDK_SECRET is missing from the .env file" });
    return;
  }
  const { sessionName, role } = req.body ?? {};
  if (!sessionName || role === undefined) {
    res.status(400).json({ error: "sessionName and role are required" });
    return;
  }
  const token = generateSignature(sessionName, role);
  res.json({ token });
});

if (isDev) {
  // run vite in middleware mode so edits to the client hot-reload in the browser
  const { createServer } = await import("vite");
  const vite = await createServer({
    root: rootDir,
    server: { middlewareMode: true },
    appType: "custom",
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    try {
      const html = fs.readFileSync(path.join(rootDir, "index.html"), "utf-8");
      res.status(200).set({ "Content-Type": "text/html" }).end(await vite.transformIndexHtml(req.originalUrl, html));
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      next(error);
    }
  });
} else {
  app.use(express.static(distPath));
  // serve the built app for any other route
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
