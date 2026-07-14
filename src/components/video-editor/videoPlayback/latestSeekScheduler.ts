export interface AnimationFrameDriver {
	request(callback: FrameRequestCallback): number;
	cancel(frameId: number): void;
}

export interface LatestSeekScheduler {
	schedule(timeSec: number): void;
	flush(): void;
	cancel(): void;
}

const browserAnimationFrameDriver: AnimationFrameDriver = {
	request: (callback) => requestAnimationFrame(callback),
	cancel: (frameId) => cancelAnimationFrame(frameId),
};

export function createLatestSeekScheduler(
	applySeek: (timeSec: number) => void,
	driver: AnimationFrameDriver = browserAnimationFrameDriver,
): LatestSeekScheduler {
	let pendingTimeSec: number | null = null;
	let frameId: number | null = null;

	const applyPending = () => {
		const timeSec = pendingTimeSec;
		pendingTimeSec = null;
		if (timeSec !== null) applySeek(timeSec);
	};

	return {
		schedule(timeSec) {
			pendingTimeSec = timeSec;
			if (frameId !== null) return;
			frameId = driver.request(() => {
				frameId = null;
				applyPending();
			});
		},
		flush() {
			if (frameId !== null) {
				driver.cancel(frameId);
				frameId = null;
			}
			applyPending();
		},
		cancel() {
			if (frameId !== null) driver.cancel(frameId);
			frameId = null;
			pendingTimeSec = null;
		},
	};
}
