import fs from "node:fs";
import path from "node:path";

const SEV_ORDER = { P0: 0, P1: 1, P2: 2, P3: 3 };

export function sortFindings(findings) {
  const effortOrder = { S: 0, M: 1, L: 2 };
  return [...findings].sort(
    (a, b) =>
      (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9) ||
      (effortOrder[a.effort] ?? 9) - (effortOrder[b.effort] ?? 9),
  );
}

export function countBySeverity(findings) {
  const counts = { P0: 0, P1: 0, P2: 0, P3: 0 };
  for (const f of findings) counts[f.severity] = (counts[f.severity] ?? 0) + 1;
  return counts;
}

/**
 * Diff against a previous ledger (if it exists). Matching is by evidence file +
 * category — ids shift between runs. Returns { fixed, stillOpen, newOnes }.
 */
export function diffAgainstPrevious(previousLedgerPath, findings) {
  if (!fs.existsSync(previousLedgerPath)) return null;
  const prev = fs.readFileSync(previousLedgerPath, "utf8");
  const prevKeys = new Set(
    [...prev.matchAll(/^\|\s*F\d+\s*\|[^|]*\|[^|]*\|[^|]*\|\s*([^|]*?)\s*\|\s*`?([^|`]*?)`?\s*\|/gm)].map(
      (m) => keyOf({ category: m[1], evidence: m[2] }),
    ),
  );
  const currentKeys = new Set(findings.map(keyOf));
  const newOnes = findings.filter((f) => !prevKeys.has(keyOf(f)));
  const stillOpen = findings.filter((f) => prevKeys.has(keyOf(f)));
  const fixed = [...prevKeys].filter((k) => !currentKeys.has(k)).length;
  return { fixed, stillOpen: stillOpen.length, newOnes: newOnes.length };
}

function keyOf(f) {
  const file = String(f.evidence ?? "").split(":")[0].trim().toLowerCase();
  return `${file}::${String(f.category ?? "").trim().toLowerCase()}`;
}

export function writeLedger(ledgerPath, { stackName, batches, findings, skipped, delta }) {
  const sorted = sortFindings(findings);
  const counts = countBySeverity(sorted);
  const lines = [
    `# UX Audit Findings Ledger`,
    ``,
    `- **Stack:** ${stackName}`,
    `- **Date:** ${new Date().toISOString().slice(0, 10)}`,
    `- **Batches:** ${batches.map((b, i) => `[x] ${i + 1} (${b.length} files)`).join(" · ")}`,
    delta
      ? `- **Δ since last audit:** ${delta.fixed} fixed · ${delta.newOnes} new · ${delta.stillOpen} still open`
      : null,
    ``,
    `## Findings`,
    ``,
    `| ID | Sev | Conf | Screen | Category | Evidence | Issue | Fix | Effort |`,
    `|----|-----|------|--------|----------|----------|-------|-----|--------|`,
    ...sorted.map(
      (f, i) =>
        `| F${i + 1} | ${f.severity} | ${f.confidence} | ${clean(f.screen)} | ${clean(f.category)} | \`${clean(f.evidence)}\` | ${clean(f.issue)} | ${clean(f.fix)} | ${f.effort} |`,
    ),
    ``,
    `**Totals:** P0: ${counts.P0} · P1: ${counts.P1} · P2: ${counts.P2} · P3: ${counts.P3}`,
    ``,
    skipped.length > 0 ? `## Skipped / not audited\n${skipped.map((s) => `- ${s}`).join("\n")}` : null,
  ];
  fs.writeFileSync(ledgerPath, lines.filter((l) => l !== null).join("\n") + "\n");
}

export function writeReport(reportPath, { stackName, scope, findings, skipped, delta, fixesApplied }) {
  const sorted = sortFindings(findings);
  const counts = countBySeverity(sorted);
  const top3 = sorted.slice(0, 3);
  const lines = [
    `# Mobile UX Audit — ${path.basename(path.resolve(scope))}`,
    ``,
    `**Date:** ${new Date().toISOString().slice(0, 10)}  ·  **Stack:** ${stackName}  ·  **Scope:** ${scope}`,
    ``,
    `## Summary`,
    delta
      ? `- **Δ since last audit:** ${delta.fixed} fixed · ${delta.newOnes} new · ${delta.stillOpen} still open`
      : null,
    `- **P0 (Blocker):** ${counts.P0}   **P1 (Major):** ${counts.P1}   **P2 (Minor):** ${counts.P2}   **P3 (Nit):** ${counts.P3}`,
    `- **Top ${top3.length} to fix now:**`,
    ...top3.map((f, i) => `  ${i + 1}. F${sorted.indexOf(f) + 1} — ${clean(f.issue)}`),
    ``,
    `## Findings`,
    `Sorted P0 → P3. Conf = verified (certain) · likely (confirm) · needs-runtime (verify on device).`,
    ``,
    `| ID | Sev | Conf | Screen | Category | Evidence | Issue | Recommended fix | Effort |`,
    `|----|-----|------|--------|----------|----------|-------|-----------------|--------|`,
    ...sorted.map(
      (f, i) =>
        `| F${i + 1} | ${f.severity} | ${f.confidence} | ${clean(f.screen)} | ${clean(f.category)} | \`${clean(f.evidence)}\` | ${clean(f.issue)} | ${clean(f.fix)} | ${f.effort} |`,
    ),
    ``,
    ...sorted
      .filter((f) => f.verify)
      .map((f) => `- **F${sorted.indexOf(f) + 1} verify:** ${clean(f.verify)}`),
    ``,
    skipped.length > 0
      ? `## Not audited / assumptions\n${skipped.map((s) => `- ${s}`).join("\n")}`
      : null,
    fixesApplied ? `\n${fixesApplied}` : null,
  ];
  fs.writeFileSync(reportPath, lines.filter((l) => l !== null).join("\n") + "\n");
}

function clean(s) {
  return String(s ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}
