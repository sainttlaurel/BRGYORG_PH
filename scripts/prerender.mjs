/**
 * Standalone prerender script — fallback for environments where the
 * vite-plugin-prerender plugin cannot run (e.g. CI without Chrome).
 *
 * Spins up `vite preview`, hits every public route with Puppeteer,
 * and overwrites dist/<route>/index.html with the rendered HTML.
 *
 * Usage:  node scripts/prerender.mjs
 * Called by:  npm run prerender:preview
 */
import { spawn } from "child_process";
import { connect } from "net";
import puppeteer from "puppeteer";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

const ROUTES = [
  "/",
  "/about",
  "/officials",
  "/services",
  "/document-application",
  "/registry",
  "/announcements",
  "/citizens-voice",
  "/community-vote",
  "/volunteer",
  "/report-concern",
  "/contact",
];

const DIST_DIR = path.resolve("dist");
const PORT = Number(process.env.PRERENDER_PORT || 4199);
const NAV_TIMEOUT = 25_000;
const EXTRA_WAIT = 2_000;

function waitForPort(port, host = "127.0.0.1", timeout = 30_000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tryConnect = () => {
      const sock = connect(port, host, () => {
        sock.destroy();
        resolve();
      });
      sock.on("error", () => {
        sock.destroy();
        if (Date.now() - start > timeout) {
          reject(new Error(`Timeout waiting for port ${port}`));
        } else {
          setTimeout(tryConnect, 300);
        }
      });
    };
    tryConnect();
  });
}

async function prerender() {
  if (!existsSync(DIST_DIR)) {
    console.error("dist/ not found. Run `vite build` first.");
    process.exit(1);
  }

  console.log(`[prerender] Starting preview server on port ${PORT}...`);
  const server = spawn("npx", [
    "vite",
    "preview",
    "--port",
    String(PORT),
    "--host",
    "127.0.0.1",
  ], {
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
    env: { ...process.env, BROWSER: "none" },
  });

  const stripAnsi = (s) => s.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "");
  server.stdout.on("data", (d) => process.stdout.write(`[preview] ${stripAnsi(d.toString())}`));
  server.stderr.on("data", (d) => process.stderr.write(`[preview] ${stripAnsi(d.toString())}`));

  try {
    await waitForPort(PORT);
    console.log(`[prerender] Server ready on http://127.0.0.1:${PORT}`);
  } catch (err) {
    console.error(`[prerender] ${err.message}`);
    server.kill();
    process.exit(1);
  }

  let browser;
  let success = 0;
  let failed = 0;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    for (const route of ROUTES) {
      const url = `http://127.0.0.1:${PORT}${route}`;
      const label = route === "/" ? "/" : route;
      process.stdout.write(`  ${label} ... `);

      try {
        await page.goto(url, { waitUntil: "networkidle0", timeout: NAV_TIMEOUT });
        await page.evaluate((ms) => new Promise((r) => setTimeout(r, ms)), EXTRA_WAIT);

        const html = await page.content();
        let outputPath;
        if (route === "/") {
          outputPath = path.join(DIST_DIR, "index.html");
        } else {
          const dirPath = path.join(DIST_DIR, route.slice(1));
          mkdirSync(dirPath, { recursive: true });
          outputPath = path.join(dirPath, "index.html");
        }
        writeFileSync(outputPath, html, "utf-8");
        console.log(`\x1b[32m✓\x1b[0m ${html.length.toLocaleString()} bytes → ${path.relative(process.cwd(), outputPath)}`);
        success++;
      } catch (err) {
        console.log(`\x1b[31m✗\x1b[0m ${err.message}`);
        failed++;
      }
    }

    await browser.close();
    console.log(`\n[prerender] Done — ${success} rendered, ${failed} failed`);
  } catch (err) {
    console.error("[prerender] Fatal:", err);
    if (browser) await browser.close().catch(() => {});
    process.exitCode = 1;
  } finally {
    server.kill();
    setTimeout(() => process.exit(), 3000);
  }
}

prerender();
