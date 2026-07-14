import { describe, expect, it } from "vitest";
import { shouldRunPreviewTicker } from "./previewTickerPolicy";

describe("shouldRunPreviewTicker", () => {
	it("keeps a paused visible preview idle", () => {
		expect(
			shouldRunPreviewTicker({
				isPlaying: false,
				isSeeking: false,
				isInteracting: false,
				isVisible: true,
				suspendRendering: false,
			}),
		).toBe(false);
	});

	it("runs only for active visible playback interactions", () => {
		const base = {
			isPlaying: false,
			isSeeking: false,
			isInteracting: false,
			isVisible: true,
			suspendRendering: false,
		};

		expect(shouldRunPreviewTicker({ ...base, isPlaying: true })).toBe(true);
		expect(shouldRunPreviewTicker({ ...base, isSeeking: true })).toBe(true);
		expect(shouldRunPreviewTicker({ ...base, isInteracting: true })).toBe(true);
		expect(shouldRunPreviewTicker({ ...base, isVisible: false, isPlaying: true })).toBe(false);
		expect(shouldRunPreviewTicker({ ...base, suspendRendering: true, isPlaying: true })).toBe(
			false,
		);
	});
});
