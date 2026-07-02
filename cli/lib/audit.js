import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const TOOLKIT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/** JSON schema for one batch's findings — guarantees parseable output. */
const FINDINGS_SCHEMA = {
  type: "object",
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          severity: { type: "string", enum: ["P0", "P1", "P2", "P3"] },
          confidence: { type: "string", enum: ["verified", "likely", "needs-runtime"] },
          screen: { type: "string" },
          category: { type: "string" },
          evidence: { type: "string", description: "file:line citation" },
          issue: { type: "string" },
          fix: { type: "string" },
          effort: { type: "string", enum: ["S", "M", "L"] },
          verify: {
            type: ["string", "null"],
            description: "How to confirm on device — only for likely/needs-runtime",
          },
        },
        required: [
          "severity",
          "confidence",
          "screen",
          "category",
          "evidence",
          "issue",
          "fix",
          "effort",
          "verify",
        ],
        additionalProperties: false,
      },
    },
    skipped: {
      type: "array",
      items: { type: "string" },
      description: "Checklist items skipped for this batch and why",
    },
  },
  required: ["findings", "skipped"],
  additionalProperties: false,
};

/**
 * Build the system prompt once: playbook + stack reference, with a cache breakpoint
 * on the last block. Byte-identical across batches, so every batch after the first
 * reads the whole thing from cache (~0.1x input price).
 */
export function buildSystem(stackName, config) {
  const playbook = fs.readFileSync(
    path.join(TOOLKIT_ROOT, "playbook", "ux-audit-playbook.md"),
    "utf8",
  );
  const stackRef = fs.readFileSync(
    path.join(TOOLKIT_ROOT, "references", "stack-detection.md"),
    "utf8",
  );
  const disabled = Object.entries(config.categories)
    .filter(([, on]) => !on)
    .map(([k]) => k);

  const header = [
    "You are running one batch of a mobile UX audit. Follow the playbook below exactly.",
    `Detected stack: ${stackName}.`,
    disabled.length > 0
      ? `Disabled categories (skip these, list them in "skipped"): ${disabled.join(", ")}.`
      : "All checklist categories are enabled.",
    "Rules: evidence (file:line) for every finding; one issue per finding; tag confidence",
    "(verified / likely / needs-runtime, with a verify hint for the latter two); dedupe —",
    "a recurring issue is ONE finding listing all affected files in evidence.",
    "Audit ONLY the files provided in the user message. Return findings via the JSON schema.",
  ].join("\n");

  return [
    { type: "text", text: header },
    { type: "text", text: `<playbook>\n${playbook}\n</playbook>` },
    {
      type: "text",
      text: `<stack-reference>\n${stackRef}\n</stack-reference>`,
      cache_control: { type: "ephemeral" }, // caches header + playbook + reference together
    },
  ];
}

/** Read one batch's files and format them as the user message. */
export function buildBatchMessage(targetDir, batchFiles, batchIndex, batchCount) {
  const parts = [`Audit batch ${batchIndex + 1}/${batchCount}. Files:\n`];
  for (const rel of batchFiles) {
    let content;
    try {
      content = fs.readFileSync(path.join(targetDir, rel), "utf8");
    } catch (err) {
      content = `<<unreadable: ${err.message}>>`;
    }
    // Number lines so evidence citations are exact.
    const numbered = content
      .split("\n")
      .map((line, i) => `${i + 1}\t${line}`)
      .join("\n");
    parts.push(`<file path="${rel}">\n${numbered}\n</file>`);
  }
  return parts.join("\n");
}

/** Run one batch through the API. Returns { findings, skipped, usage }. */
export async function auditBatch(client, { system, userText, config }) {
  const stream = client.messages.stream({
    model: config.model,
    max_tokens: config.maxTokensPerBatch,
    thinking: { type: "adaptive" },
    output_config: {
      effort: config.effort,
      format: { type: "json_schema", schema: FINDINGS_SCHEMA },
    },
    system,
    messages: [{ role: "user", content: userText }],
  });
  const message = await stream.finalMessage();

  if (message.stop_reason === "refusal") {
    throw new Error("Request was refused by the model; batch skipped.");
  }
  if (message.stop_reason === "max_tokens") {
    console.warn("  ! Batch hit max_tokens — findings may be incomplete. Raise maxTokensPerBatch.");
  }

  const text = message.content.find((b) => b.type === "text")?.text ?? "{}";
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { findings: [], skipped: ["<unparseable batch output>"] };
  }
  return {
    findings: parsed.findings ?? [],
    skipped: parsed.skipped ?? [],
    usage: message.usage,
  };
}

export function newClient() {
  // Zero-arg client: resolves ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN, or an
  // `ant auth login` profile from the environment.
  return new Anthropic();
}

/** Human-readable cache summary from a batch's usage. */
export function cacheSummary(usage) {
  const written = usage.cache_creation_input_tokens ?? 0;
  const read = usage.cache_read_input_tokens ?? 0;
  const fresh = usage.input_tokens ?? 0;
  return `in: ${fresh} fresh / ${read} cached / ${written} cache-write · out: ${usage.output_tokens}`;
}
