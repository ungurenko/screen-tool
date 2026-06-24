import { describe, expect, it } from "vitest";

import {
	DEFAULT_UPDATE_FEED_URL,
	isAutoUpdateDisabledByEnv,
	resolveUpdateFeedUrl,
} from "./updateConfig";

describe("updateConfig", () => {
	it("uses Alexander's GitHub Releases feed by default", () => {
		expect(resolveUpdateFeedUrl({})).toBe(DEFAULT_UPDATE_FEED_URL);
	});

	it("keeps a custom feed override for private testing", () => {
		expect(
			resolveUpdateFeedUrl({
				SCREENTOOL_UPDATE_FEED_URL: " https://updates.example.com/screentool ",
			}),
		).toBe("https://updates.example.com/screentool");
	});

	it("keeps the emergency auto-update kill switch", () => {
		expect(isAutoUpdateDisabledByEnv({ SCREENTOOL_DISABLE_AUTO_UPDATES: "1" })).toBe(true);
		expect(isAutoUpdateDisabledByEnv({ SCREENTOOL_DISABLE_AUTO_UPDATES: "0" })).toBe(false);
		expect(isAutoUpdateDisabledByEnv({})).toBe(false);
	});
});
