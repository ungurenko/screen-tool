import { describe, expect, it } from "vitest";
import { resolveRecordingHudMode } from "./recordingHudMode";

describe("resolveRecordingHudMode", () => {
	it("uses preflight before recording starts", () => {
		expect(
			resolveRecordingHudMode({ recording: false, paused: false, finalizing: false }),
		).toBe("preflight");
	});

	it("distinguishes active and paused recording", () => {
		expect(resolveRecordingHudMode({ recording: true, paused: false, finalizing: false })).toBe(
			"recording",
		);
		expect(resolveRecordingHudMode({ recording: true, paused: true, finalizing: false })).toBe(
			"paused",
		);
	});

	it("gives finalization priority over transient recorder flags", () => {
		expect(resolveRecordingHudMode({ recording: true, paused: true, finalizing: true })).toBe(
			"finalizing",
		);
	});
});
