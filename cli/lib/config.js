import fs from "node:fs";
import path from "node:path";

export const DEFAULT_CONFIG = {
  model: "claude-opus-4-8",
  effort: "high",
  batchSize: 6,
  maxTokensPerBatch: 32000,
  categories: {
    "touch-targets": true,
    "state-coverage": true,
    accessibility: true,
    "visual-hierarchy": true,
    responsiveness: true,
    forms: true,
    navigation: true,
    "feedback-motion": true,
    "content-copy": true,
    "platform-fit": true,
  },
  severityOverrides: {},
  failOn: "P0",
  ignore: [
    "**/node_modules/**",
    "**/build/**",
    "**/dist/**",
    "**/Pods/**",
    "**/.dart_tool/**",
    "**/*.test.*",
    "**/*.spec.*",
    "**/__tests__/**",
  ],
  screens: [],
  ledgerPath: "ux-audit-findings.md",
  reportPath: "ux-audit-report.md",
};

/** Load ux-audit.config.json from the target directory, merged over defaults. */
export function loadConfig(targetDir) {
  const file = path.join(targetDir, "ux-audit.config.json");
  let user = {};
  if (fs.existsSync(file)) {
    try {
      user = JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, ""));
    } catch (err) {
      throw new Error(`Invalid JSON in ${file}: ${err.message}`);
    }
  }
  const config = {
    ...DEFAULT_CONFIG,
    ...user,
    categories: { ...DEFAULT_CONFIG.categories, ...(user.categories ?? {}) },
    // user ignore globs EXTEND the defaults rather than replacing them
    ignore: [...DEFAULT_CONFIG.ignore, ...(user.ignore ?? [])],
  };
  config._loadedFrom = fs.existsSync(file) ? file : null;
  return config;
}

const SEVERITIES = ["P0", "P1", "P2", "P3"];

/** true if any finding is at or above the failOn gate. */
export function shouldFail(findings, failOn) {
  if (!failOn || failOn === "none") return false;
  const gate = SEVERITIES.indexOf(failOn);
  if (gate === -1) return false;
  return findings.some((f) => SEVERITIES.indexOf(f.severity) <= gate);
}

/** Apply severityOverrides: raise findings in a category to at least the configured severity. */
export function applySeverityOverrides(findings, overrides) {
  const entries = Object.entries(overrides ?? {}).filter(([k]) => !k.startsWith("_"));
  if (entries.length === 0) return findings;
  return findings.map((f) => {
    for (const [category, minSev] of entries) {
      if (
        f.category.toLowerCase().includes(category.toLowerCase()) &&
        SEVERITIES.indexOf(f.severity) > SEVERITIES.indexOf(minSev)
      ) {
        return { ...f, severity: minSev, _overridden: true };
      }
    }
    return f;
  });
}
