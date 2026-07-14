import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(new URL("./index.css", import.meta.url), "utf8");

const themedTokens = [
	"--surface-canvas",
	"--surface-panel",
	"--surface-panel-raised",
	"--surface-glass",
	"--surface-control",
	"--surface-control-hover",
	"--text-primary",
	"--text-secondary",
	"--text-tertiary",
	"--border-subtle",
	"--border-strong",
	"--accent",
	"--accent-hover",
	"--recording",
	"--recording-hover",
	"--shadow-color",
] as const;

const sharedTokens = [
	"--radius-control",
	"--radius-panel",
	"--radius-floating",
	"--motion-fast",
	"--motion-standard",
	"--ease-standard",
	"--glass-blur",
] as const;

function getRuleBody(selector: string): string {
	const start = stylesheet.indexOf(selector);
	expect(start, `Missing ${selector} rule`).toBeGreaterThanOrEqual(0);
	const open = stylesheet.indexOf("{", start);
	let depth = 0;
	for (let index = open; index < stylesheet.length; index += 1) {
		if (stylesheet[index] === "{") depth += 1;
		if (stylesheet[index] === "}") depth -= 1;
		if (depth === 0) return stylesheet.slice(open + 1, index);
	}
	throw new Error(`Unclosed ${selector} rule`);
}

describe("Liquid Glass design tokens", () => {
	it("defines the complete semantic palette for light and dark themes", () => {
		const light = getRuleBody(":root");
		const dark = getRuleBody(".dark");

		for (const token of themedTokens) {
			expect(light).toContain(`${token}:`);
			expect(dark).toContain(`${token}:`);
		}
	});

	it("defines shared shape, glass, and motion tokens", () => {
		const light = getRuleBody(":root");
		for (const token of sharedTokens) expect(light).toContain(`${token}:`);
		expect(stylesheet).toContain("@media (prefers-reduced-motion: reduce)");
	});
});
