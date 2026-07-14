import { describe, expect, it, vi } from "vitest";
import { createLatestSeekScheduler } from "./latestSeekScheduler";

describe("createLatestSeekScheduler", () => {
	it("applies only the latest seek once per animation frame", () => {
		let pendingFrame: FrameRequestCallback | null = null;
		const applySeek = vi.fn();
		const scheduler = createLatestSeekScheduler(applySeek, {
			request: (callback) => {
				pendingFrame = callback;
				return 7;
			},
			cancel: vi.fn(),
		});

		scheduler.schedule(1);
		scheduler.schedule(2.5);
		scheduler.schedule(4);

		expect(applySeek).not.toHaveBeenCalled();
		expect(pendingFrame).not.toBeNull();

		const frame = pendingFrame as FrameRequestCallback;
		frame(16);
		expect(applySeek).toHaveBeenCalledTimes(1);
		expect(applySeek).toHaveBeenCalledWith(4);
	});

	it("flushes the latest seek immediately at the end of a drag", () => {
		const cancel = vi.fn();
		const applySeek = vi.fn();
		const scheduler = createLatestSeekScheduler(applySeek, {
			request: () => 11,
			cancel,
		});

		scheduler.schedule(3.25);
		scheduler.flush();

		expect(cancel).toHaveBeenCalledWith(11);
		expect(applySeek).toHaveBeenCalledWith(3.25);
	});
});
