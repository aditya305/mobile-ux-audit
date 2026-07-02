#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { loadConfig, shouldFail, applySeverityOverrides } from "./lib/config.js";
import { detectStack, inventory, makeBatches } from "./lib/inventory.js";
import { buildSystem, buildBatchMessage, auditBatch, newClient, cacheSummary } from "./lib/audit.js";
import { writeLedger, writeReport, diffAgainstPrevious, countBySeverity } from "./lib/report.js";
import { diffScreenshots, analyzePair } from "./lib/diff.js";

const HELP = `mobile-ux-audit — batched, evidence-backed mobile UX audit (Claude API)

Usage:
  mobile-ux-audit [audit] [dir]        Audit a mobile codebase (default: cwd)
    --screens <a,b>                    Limit scope to screens matching these names
    --fail-on <P0|P1|P2|P3|none>       CI gate (default from config: P0)
    --batch-size <n>                   Files per batch (default 6)
    --model <id>                       Model override
    --dry-run                          Inventory + batch plan only, no API calls

  mobile-ux-audit diff                 Screenshot-diff regression mode
    --baseline <dir>                   Baseline screenshots (PNG, required)
    --current <dir>                    Current screenshots (PNG, required)
    --out <dir>                        Diff image output (default ./ux-diff)
    --analyze                          Ask Claude vision to judge each changed pair
    --fail-on-regression               Exit 1 if any analyzed pair is a regression

Config: ux-audit.config.json in the target dir (see ux-audit.config.example.json).
Auth:   ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN, or an \`ant auth login\` profile.
`;

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") args.help = true;
    else if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else args._.push(a);
  }
  return args;
}

async function runAudit(args) {
  const targetDir = path.resolve(args._[0] ?? ".");
  const config = loadConfig(targetDir);
  if (args["fail-on"]) config.failOn = args["fail-on"];
  if (args["batch-size"]) config.batchSize = Number(args["batch-size"]);
  if (args.model) config.model = args.model;
  if (args.screens) config.screens = String(args.screens).split(",").map((s) => s.trim());

  const stack = detectStack(targetDir);
  if (!stack) {
    console.error(
      "Could not detect a mobile stack in " + targetDir + "\n" +
      "Supported: React Native/Expo, Flutter, SwiftUI/UIKit, Compose/XML, MAUI, Ionic/Capacitor.",
    );
    process.exit(2);
  }
  console.log(`Stack: ${stack.name}`);
  if (config._loadedFrom) console.log(`Config: ${config._loadedFrom}`);

  const files = inventory(targetDir, stack, { ignore: config.ignore, screens: config.screens });
  if (files.length === 0) {
    console.error("No UI files found to audit.");
    process.exit(2);
  }
  const batches = makeBatches(files, config.batchSize);
  console.log(`Files: ${files.length} · Batches: ${batches.length} (${config.batchSize}/batch)\n`);

  if (args["dry-run"]) {
    batches.forEach((b, i) => {
      console.log(`Batch ${i + 1}:`);
      b.forEach((f) => console.log(`  ${f}`));
    });
    console.log("\nDry run — no API calls made.");
    return;
  }

  const client = newClient();
  const system = buildSystem(stack.name, config);
  const allFindings = [];
  const allSkipped = [];

  for (let i = 0; i < batches.length; i++) {
    process.stdout.write(`Batch ${i + 1}/${batches.length} (${batches[i].length} files)... `);
    const userText = buildBatchMessage(targetDir, batches[i], i, batches.length);
    try {
      const { findings, skipped, usage } = await auditBatch(client, { system, userText, config });
      allFindings.push(...findings);
      allSkipped.push(...skipped);
      const counts = countBySeverity(findings);
      console.log(
        `done — ${findings.length} findings (P0:${counts.P0} P1:${counts.P1} P2:${counts.P2} P3:${counts.P3}) · ${cacheSummary(usage)}`,
      );
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) {
        console.error("\nAuthentication failed. Set ANTHROPIC_API_KEY or run `ant auth login`.");
        process.exit(2);
      } else if (err instanceof Anthropic.RateLimitError) {
        console.error("\nRate limited after SDK retries — re-run to resume (findings so far are kept).");
        break;
      } else if (err instanceof Anthropic.APIConnectionError) {
        console.error("\nNetwork error — check connectivity and re-run.");
        break;
      } else {
        console.error(`\nBatch ${i + 1} failed: ${err.message} — continuing.`);
        allSkipped.push(`Batch ${i + 1} failed: ${err.message}`);
      }
    }
  }

  const findings = applySeverityOverrides(allFindings, config.severityOverrides);

  // Re-audit diffing: compare against the previous ledger before overwriting it.
  const ledgerPath = path.join(targetDir, config.ledgerPath);
  const delta = diffAgainstPrevious(ledgerPath, findings);

  writeLedger(ledgerPath, {
    stackName: stack.name,
    batches,
    findings,
    skipped: allSkipped,
    delta,
  });
  const reportPath = path.join(targetDir, config.reportPath);
  writeReport(reportPath, {
    stackName: stack.name,
    scope: targetDir,
    findings,
    skipped: allSkipped,
    delta,
  });

  const counts = countBySeverity(findings);
  console.log(`\nTotal: ${findings.length} findings — P0:${counts.P0} P1:${counts.P1} P2:${counts.P2} P3:${counts.P3}`);
  if (delta) {
    console.log(`Δ since last audit: ${delta.fixed} fixed · ${delta.newOnes} new · ${delta.stillOpen} still open`);
  }
  console.log(`Ledger: ${ledgerPath}\nReport: ${reportPath}`);

  if (shouldFail(findings, config.failOn)) {
    console.error(`\nFAIL: findings at or above ${config.failOn} gate.`);
    process.exit(1);
  }
}

async function runDiff(args) {
  const baseline = args.baseline && path.resolve(args.baseline);
  const current = args.current && path.resolve(args.current);
  if (!baseline || !current) {
    console.error("diff requires --baseline <dir> and --current <dir>");
    process.exit(2);
  }
  const outDir = path.resolve(args.out ?? "./ux-diff");
  const results = diffScreenshots(baseline, current, outDir);

  let regressions = 0;
  const client = args.analyze ? newClient() : null;
  const config = loadConfig(process.cwd());
  const analyses = [];

  for (const r of results) {
    if (r.status === "unchanged") console.log(`  = ${r.name}`);
    else if (r.status === "added") console.log(`  + ${r.name} (new screen)`);
    else if (r.status === "removed") console.log(`  - ${r.name} (screen removed)`);
    else if (r.status === "dimensions-changed") console.log(`  ! ${r.name} dimensions ${r.detail}`);
    else console.log(`  ~ ${r.name} ${r.pct}% pixels changed -> ${r.diffPath}`);

    if (client && r.status === "changed") {
      const verdict = await analyzePair(client, {
        model: config.model,
        name: r.name,
        baselinePath: path.join(baseline, r.name),
        currentPath: path.join(current, r.name),
      });
      analyses.push({ name: r.name, ...verdict });
      const tag = verdict.verdict === "regression" ? `REGRESSION [${verdict.severity}]` : verdict.verdict;
      console.log(`      ${tag}: ${verdict.summary}`);
      if (verdict.verdict === "regression") regressions++;
    }
  }

  if (analyses.length > 0) {
    const outFile = path.join(outDir, "regression-report.json");
    fs.writeFileSync(outFile, JSON.stringify(analyses, null, 2));
    console.log(`\nAnalysis: ${outFile}`);
  }
  if (args["fail-on-regression"] && regressions > 0) {
    console.error(`\nFAIL: ${regressions} visual regression(s).`);
    process.exit(1);
  }
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(HELP);
  process.exit(0);
}
const command = args._[0] === "diff" ? "diff" : "audit";
if (command === "diff") args._.shift();
else if (args._[0] === "audit") args._.shift();

try {
  if (command === "diff") await runDiff(args);
  else await runAudit(args);
} catch (err) {
  console.error(err.stack ?? String(err));
  process.exit(2);
}
