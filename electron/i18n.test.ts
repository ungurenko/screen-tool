import { describe, expect, it } from "vitest";
import { normalizeElectronLocale } from "./i18n";

describe("electron i18n", () => {
	it("uses Russian when no Electron locale was explicitly saved", () => {
		expect(normalizeElectronLocale(undefined)).toBe("ru");
	});

	it("keeps an explicitly saved English locale", () => {
		expect(normalizeElectronLocale("en")).toBe("en");
	});
});
