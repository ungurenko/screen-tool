import { useSyncExternalStore } from "react";

export interface PlaybackSnapshot {
	currentTimeSec: number;
	isPlaying: boolean;
	isSeeking: boolean;
}

export interface PlaybackClock {
	getSnapshot(): PlaybackSnapshot;
	subscribe(listener: () => void): () => void;
	publishFrame(timeSec: number): void;
	commit(timeSec: number): void;
	setPlaying(isPlaying: boolean): void;
	setSeeking(isSeeking: boolean): void;
}

function normalizeTime(timeSec: number): number {
	return Number.isFinite(timeSec) ? Math.max(0, timeSec) : 0;
}

export function createPlaybackClock(initialTimeSec = 0): PlaybackClock {
	let snapshot: PlaybackSnapshot = {
		currentTimeSec: normalizeTime(initialTimeSec),
		isPlaying: false,
		isSeeking: false,
	};
	const listeners = new Set<() => void>();

	const update = (next: PlaybackSnapshot) => {
		if (
			next.currentTimeSec === snapshot.currentTimeSec &&
			next.isPlaying === snapshot.isPlaying &&
			next.isSeeking === snapshot.isSeeking
		) {
			return;
		}

		snapshot = next;
		for (const listener of listeners) listener();
	};

	return {
		getSnapshot: () => snapshot,
		subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		publishFrame(timeSec) {
			update({ ...snapshot, currentTimeSec: normalizeTime(timeSec) });
		},
		commit(timeSec) {
			update({
				...snapshot,
				currentTimeSec: normalizeTime(timeSec),
				isSeeking: false,
			});
		},
		setPlaying(isPlaying) {
			update({ ...snapshot, isPlaying });
		},
		setSeeking(isSeeking) {
			update({ ...snapshot, isSeeking });
		},
	};
}

export function usePlaybackSnapshot(clock: PlaybackClock): PlaybackSnapshot {
	return useSyncExternalStore(clock.subscribe, clock.getSnapshot, clock.getSnapshot);
}
