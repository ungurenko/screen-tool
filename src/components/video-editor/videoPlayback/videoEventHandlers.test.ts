import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/extensions", () => ({
	extensionHost: {
		emitEvent: vi.fn(),
	},
}));

import { extensionHost } from "@/lib/extensions";
import { createPlaybackClock } from "./playbackClock";
import { createVideoEventHandlers } from "./videoEventHandlers";

type PresentedFrameCallback = (now: DOMHighResTimeStamp, metadata: { mediaTime?: number }) => void;

type MockVideo = HTMLVideoElement & {
	requestVideoFrameCallback?: (callback: PresentedFrameCallback) => number;
	cancelVideoFrameCallback?: (handle: number) => void;
};

function createMutableRef<T>(value: T) {
	return { current: value };
}

function createMockVideo(overrides: Partial<MockVideo> = {}): MockVideo {
	const video = {
		currentTime: 0.5,
		duration: 10,
		paused: false,
		ended: false,
		playbackRate: 1,
		pause: vi.fn(),
	} as unknown as MockVideo;

	return Object.assign(video, overrides);
}

describe("createVideoEventHandlers", () => {
	const emitEventMock = vi.mocked(extensionHost.emitEvent);
	let requestAnimationFrameMock: ReturnType<typeof vi.fn>;
	let cancelAnimationFrameMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		requestAnimationFrameMock = vi.fn(() => 11);
		cancelAnimationFrameMock = vi.fn();
		vi.stubGlobal("requestAnimationFrame", requestAnimationFrameMock);
		vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrameMock);
		emitEventMock.mockReset();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("prefers requestVideoFrameCallback mediaTime when available", () => {
		let presentedFrameCallback: PresentedFrameCallback | null = null;
		const video = createMockVideo({
			requestVideoFrameCallback: vi.fn((callback) => {
				presentedFrameCallback = callback;
				return 7;
			}),
			cancelVideoFrameCallback: vi.fn(),
		});
		const onPlayStateChange = vi.fn();
		const onTimeCommit = vi.fn();
		const playbackClock = createPlaybackClock();
		const publishFrame = vi.spyOn(playbackClock, "publishFrame");
		const currentTimeRef = createMutableRef(0);
		const timeUpdateAnimationRef = createMutableRef<number | null>(null);

		const handlers = createVideoEventHandlers({
			video,
			isSeekingRef: createMutableRef(false),
			isPlayingRef: createMutableRef(false),
			allowPlaybackRef: createMutableRef(true),
			currentTimeRef,
			timeUpdateAnimationRef,
			onPlayStateChange,
			onTimeCommit,
			playbackClock,
			trimRegionsRef: createMutableRef([]),
			speedRegionsRef: createMutableRef([]),
		});

		handlers.handlePlay();
		expect(onPlayStateChange).toHaveBeenCalledWith(true);
		expect(video.requestVideoFrameCallback).toHaveBeenCalledTimes(1);
		expect(requestAnimationFrameMock).not.toHaveBeenCalled();

		presentedFrameCallback?.(0, { mediaTime: 1.25 });

		expect(publishFrame).toHaveBeenCalledWith(1.25);
		expect(onTimeCommit).not.toHaveBeenCalled();
		expect(currentTimeRef.current).toBe(1250);
		expect(emitEventMock).toHaveBeenLastCalledWith({
			type: "playback:timeupdate",
			timeMs: 1250,
		});
	});

	it("falls back to requestAnimationFrame when requestVideoFrameCallback is unavailable", () => {
		let animationFrameCallback: FrameRequestCallback | null = null;
		requestAnimationFrameMock.mockImplementation((callback: FrameRequestCallback) => {
			animationFrameCallback = callback;
			return 19;
		});
		const video = createMockVideo({ currentTime: 0.75 });
		const playbackClock = createPlaybackClock();
		const publishFrame = vi.spyOn(playbackClock, "publishFrame");

		const handlers = createVideoEventHandlers({
			video,
			isSeekingRef: createMutableRef(false),
			isPlayingRef: createMutableRef(false),
			allowPlaybackRef: createMutableRef(true),
			currentTimeRef: createMutableRef(0),
			timeUpdateAnimationRef: createMutableRef<number | null>(null),
			onPlayStateChange: vi.fn(),
			onTimeCommit: vi.fn(),
			playbackClock,
			trimRegionsRef: createMutableRef([]),
			speedRegionsRef: createMutableRef([]),
		});

		handlers.handlePlay();
		expect(requestAnimationFrameMock).toHaveBeenCalledTimes(1);

		video.paused = true;
		animationFrameCallback?.(0);

		expect(publishFrame).toHaveBeenCalledWith(0.75);
	});

	it("skips removed footage when playback reaches a cut region", () => {
		let animationFrameCallback: FrameRequestCallback | null = null;
		requestAnimationFrameMock.mockImplementation((callback: FrameRequestCallback) => {
			animationFrameCallback = callback;
			return 29;
		});
		const video = createMockVideo({ currentTime: 1.25, duration: 10 });
		const playbackClock = createPlaybackClock();
		const publishFrame = vi.spyOn(playbackClock, "publishFrame");
		const handlers = createVideoEventHandlers({
			video,
			isSeekingRef: createMutableRef(false),
			isPlayingRef: createMutableRef(false),
			allowPlaybackRef: createMutableRef(true),
			currentTimeRef: createMutableRef(0),
			timeUpdateAnimationRef: createMutableRef<number | null>(null),
			onPlayStateChange: vi.fn(),
			onTimeCommit: vi.fn(),
			playbackClock,
			trimRegionsRef: createMutableRef([{ id: "trim-1", startMs: 1000, endMs: 2000 }]),
			speedRegionsRef: createMutableRef([]),
		});

		handlers.handlePlay();
		animationFrameCallback?.(0);

		expect(video.currentTime).toBe(2);
		expect(video.pause).not.toHaveBeenCalled();
		expect(publishFrame).toHaveBeenLastCalledWith(2);
	});

	it("cancels a pending requestVideoFrameCallback on pause and dispose", () => {
		const cancelVideoFrameCallback = vi.fn();
		const video = createMockVideo({
			requestVideoFrameCallback: vi.fn(() => 23),
			cancelVideoFrameCallback,
		});
		const handlers = createVideoEventHandlers({
			video,
			isSeekingRef: createMutableRef(false),
			isPlayingRef: createMutableRef(false),
			allowPlaybackRef: createMutableRef(true),
			currentTimeRef: createMutableRef(0),
			timeUpdateAnimationRef: createMutableRef<number | null>(null),
			onPlayStateChange: vi.fn(),
			onTimeCommit: vi.fn(),
			playbackClock: createPlaybackClock(),
			trimRegionsRef: createMutableRef([]),
			speedRegionsRef: createMutableRef([]),
		});

		handlers.handlePlay();
		handlers.handlePause();
		expect(cancelVideoFrameCallback).toHaveBeenCalledWith(23);

		cancelVideoFrameCallback.mockClear();
		handlers.handlePlay();
		handlers.dispose();
		expect(cancelVideoFrameCallback).toHaveBeenCalledWith(23);
	});

	it("skips removed footage after a paused seek", () => {
		const video = createMockVideo({
			currentTime: 1.25,
			paused: true,
		});
		const playbackClock = createPlaybackClock();
		const publishFrame = vi.spyOn(playbackClock, "publishFrame");
		const handlers = createVideoEventHandlers({
			video,
			isSeekingRef: createMutableRef(true),
			isPlayingRef: createMutableRef(false),
			allowPlaybackRef: createMutableRef(true),
			currentTimeRef: createMutableRef(0),
			timeUpdateAnimationRef: createMutableRef<number | null>(null),
			onPlayStateChange: vi.fn(),
			onTimeCommit: vi.fn(),
			playbackClock,
			trimRegionsRef: createMutableRef([{ id: "trim-1", startMs: 1000, endMs: 2000 }]),
			speedRegionsRef: createMutableRef([]),
		});

		handlers.handleSeeked();

		expect(video.currentTime).toBe(2);
		expect(publishFrame).toHaveBeenLastCalledWith(2);
	});

	it("commits time only when playback pauses", () => {
		const video = createMockVideo({ currentTime: 3.25, paused: true });
		const onTimeCommit = vi.fn();
		const playbackClock = createPlaybackClock();
		const handlers = createVideoEventHandlers({
			video,
			isSeekingRef: createMutableRef(false),
			isPlayingRef: createMutableRef(true),
			allowPlaybackRef: createMutableRef(true),
			currentTimeRef: createMutableRef(0),
			timeUpdateAnimationRef: createMutableRef<number | null>(null),
			onPlayStateChange: vi.fn(),
			onTimeCommit,
			playbackClock,
			trimRegionsRef: createMutableRef([]),
			speedRegionsRef: createMutableRef([]),
		});

		handlers.handlePause();

		expect(onTimeCommit).toHaveBeenCalledOnce();
		expect(onTimeCommit).toHaveBeenCalledWith(3.25);
		expect(playbackClock.getSnapshot()).toEqual({
			currentTimeSec: 3.25,
			isPlaying: false,
			isSeeking: false,
		});
	});
});
