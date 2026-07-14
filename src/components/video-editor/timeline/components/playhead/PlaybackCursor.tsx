import { useTimelineContext } from "dnd-timeline";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { createLatestSeekScheduler } from "../../../videoPlayback/latestSeekScheduler";
import { type PlaybackClock, usePlaybackSnapshot } from "../../../videoPlayback/playbackClock";
import { formatPlayheadTime } from "../../core/time";

interface PlaybackCursorProps {
	playbackClock: PlaybackClock;
	mapSourceTimeToTimelineTime: (timeSec: number) => number;
	videoDurationMs: number;
	onSeekPreview?: (time: number) => void;
	onSeekCommit?: (time: number) => void;
	timelineRef: RefObject<HTMLDivElement>;
	keyframes?: { id: string; time: number }[];
	isLoading?: boolean;
}

export default function PlaybackCursor({
	playbackClock,
	mapSourceTimeToTimelineTime,
	videoDurationMs,
	onSeekPreview,
	onSeekCommit,
	timelineRef,
	keyframes = [],
	isLoading = false,
}: PlaybackCursorProps) {
	const { sidebarWidth, direction, range, valueToPixels, pixelsToValue } = useTimelineContext();
	const sideProperty = direction === "rtl" ? "right" : "left";
	const [isDragging, setIsDragging] = useState(false);
	const snapshot = usePlaybackSnapshot(playbackClock);
	const currentTimeMs = Math.round(mapSourceTimeToTimelineTime(snapshot.currentTimeSec) * 1000);
	const pendingSeekTimeRef = useRef<number | null>(null);
	const seekScheduler = useMemo(
		() => createLatestSeekScheduler((timeSec) => onSeekPreview?.(timeSec)),
		[onSeekPreview],
	);

	useEffect(() => () => seekScheduler.cancel(), [seekScheduler]);

	useEffect(() => {
		if (!isDragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			if (!timelineRef.current || !onSeekPreview) return;
			const rect = timelineRef.current.getBoundingClientRect();
			const clickX = e.clientX - rect.left - sidebarWidth;
			const relativeMs = pixelsToValue(clickX);
			let absoluteMs = Math.max(0, Math.min(range.start + relativeMs, videoDurationMs));

			const snapThresholdMs = 150;
			const nearbyKeyframe = keyframes.find(
				(kf) =>
					Math.abs(kf.time - absoluteMs) <= snapThresholdMs &&
					kf.time >= range.start &&
					kf.time <= range.end,
			);
			if (nearbyKeyframe) absoluteMs = nearbyKeyframe.time;

			const timeSec = absoluteMs / 1000;
			pendingSeekTimeRef.current = timeSec;
			seekScheduler.schedule(timeSec);
		};

		const handleMouseUp = () => {
			seekScheduler.flush();
			if (pendingSeekTimeRef.current !== null) {
				onSeekCommit?.(pendingSeekTimeRef.current);
				pendingSeekTimeRef.current = null;
			}
			setIsDragging(false);
			document.body.style.cursor = "";
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);
		document.body.style.cursor = "ew-resize";

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
			document.body.style.cursor = "";
		};
	}, [
		isDragging,
		onSeekPreview,
		onSeekCommit,
		seekScheduler,
		timelineRef,
		sidebarWidth,
		range.start,
		range.end,
		videoDurationMs,
		pixelsToValue,
		keyframes,
	]);

	if (videoDurationMs <= 0 || currentTimeMs < 0) return null;
	const clampedTime = Math.min(currentTimeMs, videoDurationMs);
	if (clampedTime < range.start || clampedTime > range.end) return null;

	const offset = valueToPixels(clampedTime - range.start);

	return (
		<div
			className="absolute top-0 bottom-0 z-50 group/cursor"
			style={{
				[sideProperty === "right" ? "marginRight" : "marginLeft"]: `${sidebarWidth - 1}px`,
				pointerEvents: "none",
			}}
		>
			<div
				className="absolute top-0 bottom-0 w-[2px] bg-[#2563EB] shadow-[0_0_10px_rgba(37,99,235,0.5)] cursor-ew-resize pointer-events-auto hover:shadow-[0_0_15px_rgba(37,99,235,0.7)] transition-shadow"
				style={{ [sideProperty]: `${offset}px` }}
				onMouseDown={(e) => {
					e.stopPropagation();
					pendingSeekTimeRef.current = currentTimeMs / 1000;
					setIsDragging(true);
				}}
			>
				<div
					className="absolute -top-1 left-1/2 -translate-x-1/2 hover:scale-125 transition-transform"
					style={{ width: "16px", height: "16px" }}
				>
					<div className="w-3 h-3 mx-auto mt-[2px] bg-[#2563EB] rotate-45 rounded-sm shadow-lg border border-foreground/20" />
				</div>
				<div
					className={cn(
						"absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-white/90 font-medium tabular-nums whitespace-nowrap border border-foreground/10 shadow-lg pointer-events-none transition-opacity",
						isDragging || isLoading ? "opacity-100" : "opacity-0",
					)}
				>
					<div className="flex items-center">
						{formatPlayheadTime(clampedTime)
							.split("")
							.map((char, i) => (
								<span
									key={i}
									className={cn(
										"leading-5 whitespace-pre",
										isLoading &&
											"bg-gradient-to-r from-white/40 via-white to-white/40 bg-clip-text text-transparent animate-text-shimmer",
									)}
									style={
										isLoading
											? {
													animationDelay: `${i * 0.05}s`,
													animationDuration: "2.5s",
												}
											: undefined
									}
								>
									{char}
								</span>
							))}
					</div>
				</div>
			</div>
		</div>
	);
}
