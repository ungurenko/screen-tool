import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { resolveInitialLocalePreference } from "./I18nContext";

describe("I18nContext locale defaults", () => {
	it("uses Russian as the default locale for ScreenTool", () => {
		expect(DEFAULT_LOCALE).toBe("ru");
	});

	it("uses Russian when no language was explicitly saved", () => {
		expect(resolveInitialLocalePreference(null, null)).toBe("ru");
	});

	it("keeps an explicitly saved English locale", () => {
		expect(resolveInitialLocalePreference("en", null)).toBe("en");
	});
});
