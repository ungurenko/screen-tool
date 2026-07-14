export type RecordingHudMode = "preflight" | "recording" | "paused" | "finalizing";

export function resolveRecordingHudMode({
	recording,
	paused,
	finalizing,
}: {
	recording: boolean;
	paused: boolean;
	finalizing: boolean;
}): RecordingHudMode {
	if (finalizing) return "finalizing";
	if (!recording) return "preflight";
	return paused ? "paused" : "recording";
}
