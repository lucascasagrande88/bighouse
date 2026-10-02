// Local preview: node dev-server.mjs  →  http://localhost:8888
import http from "node:http";
import { readFile, mkdtemp } from "node:fs/promises";
import { join, extname } from "node:path";
import { tmpdir } from "node:os";
import { BlobsServer } from "@netlify/blobs/server";

const PORT = Number(process.env.PORT || 8888);
const dir = await mkdtemp(join(tmpdir(), "bvcq-blobs-"));
const blobs = new BlobsServer({ directory: dir, token: "dev", port: 0 });
const { port } = await blobs.start();
globalThis.netlifyBlobsContext = Buffer.from(JSON.stringify({ siteID: "dev", token: "dev", edgeURL: `http://localhost:${port}`, uncachedEdgeURL: `http://localhost:${port}` })).toString("base64");
globalThis.Netlify = { context: { deploy: { context: "production" } }, env: { get: (k) => (k === "ADMIN_PASSWORD" ? process.env.ADMIN_PASSWORD || "dev" : process.env[k]) } };
const { default: handler } = await import("./netlify/functions/api.mjs");

const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".jpg": "image/jpeg" };
http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname.startsWith("/api/")) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const r = await handler(new Request(url, { method: req.method, headers: req.headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks) }));
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(Buffer.from(await r.arrayBuffer()));
    return;
  }
  let p = url.pathname === "/" ? "/index.html" : url.pathname === "/admin" || url.pathname === "/admin/" ? "/admin/index.html" : url.pathname;
  try {
    const buf = await readFile(join(import.meta.dirname, "public", p));
    res.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" });
    res.end(buf);
  } catch { res.writeHead(404); res.end("404"); }
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
