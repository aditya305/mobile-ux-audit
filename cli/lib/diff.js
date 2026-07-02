import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

/**
 * Compare same-named PNGs in baseline vs current dirs.
 * Returns per-screen results; writes visual diff PNGs to outDir.
 */
export function diffScreenshots(baselineDir, currentDir, outDir, { threshold = 0.1 } = {}) {
  const baseline = listPngs(baselineDir);
  const current = listPngs(currentDir);
  fs.mkdirSync(outDir, { recursive: true });

  const results = [];
  for (const name of new Set([...baseline, ...current])) {
    const inBase = baseline.includes(name);
    const inCurr = current.includes(name);
    if (!inBase) {
      results.push({ name, status: "added" });
      continue;
    }
    if (!inCurr) {
      results.push({ name, status: "removed" });
      continue;
    }
    const a = PNG.sync.read(fs.readFileSync(path.join(baselineDir, name)));
    const b = PNG.sync.read(fs.readFileSync(path.join(currentDir, name)));
    if (a.width !== b.width || a.height !== b.height) {
      results.push({
        name,
        status: "dimensions-changed",
        detail: `${a.width}x${a.height} -> ${b.width}x${b.height}`,
      });
      continue;
    }
    const diff = new PNG({ width: a.width, height: a.height });
    const changedPixels = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
      threshold,
    });
    const pct = (changedPixels / (a.width * a.height)) * 100;
    if (changedPixels > 0) {
      const diffPath = path.join(outDir, name.replace(/\.png$/i, ".diff.png"));
      fs.writeFileSync(diffPath, PNG.sync.write(diff));
      results.push({ name, status: "changed", pct: pct.toFixed(2), diffPath });
    } else {
      results.push({ name, status: "unchanged" });
    }
  }
  return results;
}

function listPngs(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".png"))
    .sort();
}

const REGRESSION_SCHEMA = {
  type: "object",
  properties: {
    verdict: { type: "string", enum: ["regression", "improvement", "neutral", "unclear"] },
    severity: { type: "string", enum: ["P0", "P1", "P2", "P3", "none"] },
    summary: { type: "string" },
    details: { type: "array", items: { type: "string" } },
  },
  required: ["verdict", "severity", "summary", "details"],
  additionalProperties: false,
};

/**
 * Send a baseline/current screenshot pair to Claude vision and ask whether the
 * visual change is a UX regression. Returns the parsed verdict object.
 */
export async function analyzePair(client, { model, name, baselinePath, currentPath }) {
  const toImageBlock = (file) => ({
    type: "image",
    source: {
      type: "base64",
      media_type: "image/png",
      data: fs.readFileSync(file).toString("base64"),
    },
  });

  const stream = client.messages.stream({
    model,
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    output_config: { format: { type: "json_schema", schema: REGRESSION_SCHEMA } },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              `Screen "${name}". Image 1 is the BASELINE (previous build), image 2 is the CURRENT build. ` +
              `Assess whether the visual change is a UX regression: broken layout, clipped/overlapping text, ` +
              `content under notch/system bars, lost affordances, contrast loss, missing states. ` +
              `Intentional redesigns that don't harm usability are "neutral" or "improvement". ` +
              `Cite regions (top bar, primary button, list rows...) in details.`,
          },
          toImageBlock(baselinePath),
          toImageBlock(currentPath),
        ],
      },
    ],
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") {
    return { verdict: "unclear", severity: "none", summary: "Model refused.", details: [] };
  }
  const text = message.content.find((b) => b.type === "text")?.text ?? "{}";
  try {
    return JSON.parse(text);
  } catch {
    return { verdict: "unclear", severity: "none", summary: text.slice(0, 200), details: [] };
  }
}
