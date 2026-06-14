import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const globalsCss = readFileSync(
  fileURLToPath(new URL("../globals.css", import.meta.url)),
  "utf8",
);
const layoutSrc = readFileSync(
  fileURLToPath(new URL("../layout.tsx", import.meta.url)),
  "utf8",
);
const chartSrc = readFileSync(
  fileURLToPath(new URL("../../components/chart/ChartScreen.tsx", import.meta.url)),
  "utf8",
);

describe("mobile input zoom regression", () => {
  it("keeps desktop v2-input text at 15px and raises mobile text to 16px", () => {
    const baseInputStart = globalsCss.indexOf(".v2-input {");
    const baseInputEnd = globalsCss.indexOf("}", baseInputStart);
    const baseInputBlock = globalsCss.slice(baseInputStart, baseInputEnd);

    expect(baseInputBlock).toContain("font-size: 15px;");
    expect(globalsCss).toMatch(
      /@media\s*\(max-width:\s*768px\)\s*{\s*\.v2-input\s*{\s*font-size:\s*16px;\s*}\s*}/,
    );
  });

  it("does not add viewport scale hacks and keeps the result scroll reset", () => {
    const viewportSources = `${globalsCss}\n${layoutSrc}`;

    expect(viewportSources).not.toMatch(/user-scalable\s*=\s*no/i);
    expect(viewportSources).not.toMatch(/maximum-scale\s*=\s*1/i);
    expect(chartSrc).toContain("window.requestAnimationFrame");
    expect(chartSrc).toContain("window.scrollTo(0, 0)");
    expect(chartSrc).toContain("window.cancelAnimationFrame(frame)");
  });
});
