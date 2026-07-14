import { describe, expect, it, vi } from "vitest";
import { createPlaybackClock } from "./playbackClock";

describe("createPlaybackClock", () => {
	it("publishes frame time only to clock subscribers", () => {
		const clock = createPlaybackClock();
		const listener = vi.fn();
		const unsubscribe = clock.subscribe(listener);

		clock.publishFrame(1.25);

		expect(clock.getSnapshot()).toEqual({
			currentTimeSec: 1.25,
			isPlaying: false,
			isSeeking: false,
		});
		expect(listener).toHaveBeenCalledTimes(1);

		clock.publishFrame(1.25);
		expect(listener).toHaveBeenCalledTimes(1);

		unsubscribe();
		clock.publishFrame(2);
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it("tracks playback and seek state independently from committed time", () => {
		const clock = createPlaybackClock(4);

		clock.setPlaying(true);
		clock.setSeeking(true);
		clock.publishFrame(4.5);

		expect(clock.getSnapshot()).toEqual({
			currentTimeSec: 4.5,
			isPlaying: true,
			isSeeking: true,
		});

		clock.commit(5);
		expect(clock.getSnapshot()).toEqual({
			currentTimeSec: 5,
			isPlaying: true,
			isSeeking: false,
		});
	});
});
