import { describe, expect, it } from "vitest";

import {
	computeBrowserRecordingBitrate,
	constrainRecordingDimensions,
	estimateRecordingWorkload,
	getRecordingCaptureProfile,
	normalizeRecordingQualityPresetId,
	RECORDING_CAPTURE_PROFILE,
} from "./recordingPerformance";

describe("recording performance profile", () => {
	it("caps a Retina iMac screen to a much lighter recording workload", () => {
		const previousFullRetinaWorkload = estimateRecordingWorkload({
			width: 4480,
			height: 2520,
			frameRate: 60,
			queueDepth: 6,
		});
		const dimensions = constrainRecordingDimensions({ width: 4480, height: 2520 });
		const optimizedWorkload = estimateRecordingWorkload({
			...dimensions,
			frameRate: RECORDING_CAPTURE_PROFILE.frameRate,
			queueDepth: RECORDING_CAPTURE_PROFILE.queueDepth,
		});

		expect(dimensions).toEqual({ width: 2560, height: 1440 });
		expect(optimizedWorkload.pixelsPerSecond).toBeLessThanOrEqual(
			previousFullRetinaWorkload.pixelsPerSecond * 0.2,
		);
		expect(optimizedWorkload.bufferBytes).toBeLessThanOrEqual(
			previousFullRetinaWorkload.bufferBytes * 0.2,
		);
	});

	it("keeps browser fallback bitrate aligned with the lighter 30fps profile", () => {
		expect(
			computeBrowserRecordingBitrate({
				width: RECORDING_CAPTURE_PROFILE.maxWidth,
				height: RECORDING_CAPTURE_PROFILE.maxHeight,
				frameRate: RECORDING_CAPTURE_PROFILE.frameRate,
			}),
		).toBe(16_000_000);
	});

	it("normalizes saved recording quality safely", () => {
		expect(normalizeRecordingQualityPresetId("efficient")).toBe("efficient");
		expect(normalizeRecordingQualityPresetId("maximum")).toBe("maximum");
		expect(normalizeRecordingQualityPresetId("surprise-me")).toBe("balanced");
	});

	it("provides explicit capture settings for each quality mode", () => {
		expect(getRecordingCaptureProfile("efficient")).toMatchObject({
			frameRate: 24,
			maxWidth: 1920,
			maxHeight: 1080,
			queueDepth: 3,
		});
		expect(getRecordingCaptureProfile("balanced")).toMatchObject({
			frameRate: 30,
			maxWidth: 2560,
			maxHeight: 1440,
			queueDepth: 3,
		});
		expect(getRecordingCaptureProfile("maximum")).toMatchObject({
			frameRate: 60,
			maxWidth: 3840,
			maxHeight: 2160,
			queueDepth: 6,
		});
	});
});
