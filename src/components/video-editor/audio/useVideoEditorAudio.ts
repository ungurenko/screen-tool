import React, { useCallback, useMemo } from "react";
import {
	SOURCE_AUDIO_NORMALIZE_GAIN,
	type SourceAudioTrackSettings,
} from "@/components/video-editor/audio/audioTypes";
import { getSourceTrackIdFromPath } from "@/lib/exporter/audioRoutingEngine";
import { resolveSourceTrackRoutingPolicy } from "@/lib/exporter/sourceTrackRoutingPolicy";
import type { AudioRegion, ClipRegion, SpeedRegion } from "../types";
import type { PlaybackClock } from "../videoPlayback/playbackClock";
import { getActiveClipIdAtSourceTime, isClipMutedById } from "./clipAudio";
import { useAudioPreviewSync } from "./useAudioPreviewSync";
import { useClipAudioSettingsController } from "./useClipAudioSettingsController";
import { useSourceAudioFallback } from "./useSourceAudioFallback";

function extractLocalPathFromMediaServerUrl(input: string | null | undefined): string | null {
	if (!input) return null;
	try {
		const url = new URL(input);
		const isLocalMediaServer =
			(url.protocol === "http:" || url.protocol === "https:") &&
			(url.hostname === "127.0.0.1" || url.hostname === "localhost") &&
			url.pathname === "/video";
		if (!isLocalMediaServer) return null;
		return url.searchParams.get("path");
	} catch {
		return null;
	}
}

interface UseVideoEditorAudioParams {
	currentSourcePath: string | null;
	selectedClipId: string | null;
	clipRegions: ClipRegion[];
	audioRegions: AudioRegion[];
	effectiveSpeedRegions: SpeedRegion[];
	sourceAudioTrackSettingsByClip: Record<string, SourceAudioTrackSettings>;
	setSourceAudioTrackSettingsByClip: React.Dispatch<
		React.SetStateAction<Record<string, SourceAudioTrackSettings>>
	>;
	defaultSourceAudioTrackSettings: SourceAudioTrackSettings;
	setDefaultSourceAudioTrackSettings: React.Dispatch<
		React.SetStateAction<SourceAudioTrackSettings>
	>;
	currentTime: number;
	playbackClock: PlaybackClock;
	mapSourceTimeToTimelineTime: (timeSec: number) => number;
	duration: number;
	isPlaying: boolean;
	previewVolume: number;
	sourceAudioFallbackRefreshKey?: number;
	summarizeErrorMessage: (message: string) => string;
	onSourceFallbackLoadError: (error: unknown) => void;
}

export function useVideoEditorAudio({
	currentSourcePath,
	selectedClipId,
	clipRegions,
	audioRegions,
	effectiveSpeedRegions,
	sourceAudioTrackSettingsByClip,
	setSourceAudioTrackSettingsByClip,
	defaultSourceAudioTrackSettings,
	setDefaultSourceAudioTrackSettings,
	currentTime,
	playbackClock,
	mapSourceTimeToTimelineTime,
	duration,
	isPlaying,
	previewVolume,
	sourceAudioFallbackRefreshKey = 0,
	summarizeErrorMessage,
	onSourceFallbackLoadError,
}: UseVideoEditorAudioParams) {
	const fallbackLookupSourcePath = useMemo(
		() => extractLocalPathFromMediaServerUrl(currentSourcePath) ?? currentSourcePath,
		[currentSourcePath],
	);

	const { sourceAudioFallbackPaths, sourceAudioFallbackStartDelayMsByPath } =
		useSourceAudioFallback({
			currentSourcePath: fallbackLookupSourcePath,
			refreshKey: sourceAudioFallbackRefreshKey,
			summarizeErrorMessage,
		});

	const sourceTrackRoutingPolicy = useMemo(
		() => resolveSourceTrackRoutingPolicy(currentSourcePath, sourceAudioFallbackPaths),
		[currentSourcePath, sourceAudioFallbackPaths],
	);
	const previewSourceAudioFallbackPaths = sourceTrackRoutingPolicy.playbackPaths;
	const shouldMutePreviewVideo = sourceTrackRoutingPolicy.muteEmbeddedPreview;

	const activeClipIdAtCurrentTime = useMemo(
		() => getActiveClipIdAtSourceTime(currentTime, clipRegions),
		[clipRegions, currentTime],
	);
	const isCurrentClipMuted = useMemo(
		() => isClipMutedById(activeClipIdAtCurrentTime, clipRegions),
		[activeClipIdAtCurrentTime, clipRegions],
	);

	const {
		sourceAudioTrackMeta,
		activeSourceAudioTrackSettings,
		selectedClipSourceAudioTrackSettings,
		getSourceAudioTrackSettingsForClip,
		onSourceAudioTracksMetaChange,
		onSelectedClipSourceAudioTrackVolumeChange,
		onSelectedClipSourceAudioTrackNormalizeChange,
		embeddedSourcePreviewGain,
		getSourceTrackPreviewGain,
	} = useClipAudioSettingsController({
		selectedClipId,
		activeClipId: activeClipIdAtCurrentTime,
		sourceAudioTrackSettingsByClip,
		setSourceAudioTrackSettingsByClip,
		defaultSourceAudioTrackSettings,
		setDefaultSourceAudioTrackSettings,
	});

	const getIsClipMutedAtSourceTime = useCallback(
		(timeSec: number) =>
			isClipMutedById(getActiveClipIdAtSourceTime(timeSec, clipRegions), clipRegions),
		[clipRegions],
	);
	const getSourceTrackPreviewGainAtSourceTime = useCallback(
		(audioPath: string, timeSec: number) => {
			const clipId = getActiveClipIdAtSourceTime(timeSec, clipRegions);
			const settings = getSourceAudioTrackSettingsForClip(clipId);
			const trackId = getSourceTrackIdFromPath(audioPath);
			const trackSettings = settings[trackId] ?? { volume: 1, normalize: false };
			const normalizeGain = trackSettings.normalize ? SOURCE_AUDIO_NORMALIZE_GAIN : 1;
			return Math.max(0, Math.min(1, trackSettings.volume * normalizeGain));
		},
		[clipRegions, getSourceAudioTrackSettingsForClip],
	);

	const { playSourceAudioPreview } = useAudioPreviewSync({
		audioRegions,
		previewVolume,
		isPlaying,
		playbackClock,
		mapSourceTimeToTimelineTime,
		duration,
		effectiveSpeedRegions,
		previewSourceAudioFallbackPaths,
		sourceAudioFallbackStartDelayMsByPath,
		isCurrentClipMuted,
		getIsClipMutedAtSourceTime,
		getSourceTrackPreviewGain,
		getSourceTrackPreviewGainAtSourceTime,
		onSourceFallbackLoadError,
	});

	return {
		sourceAudioFallbackPaths,
		sourceAudioFallbackStartDelayMsByPath,
		previewSourceAudioFallbackPaths,
		shouldMutePreviewVideo,
		activeClipIdAtCurrentTime,
		isCurrentClipMuted,
		sourceAudioTrackMeta,
		activeSourceAudioTrackSettings,
		selectedClipSourceAudioTrackSettings,
		playSourceAudioPreview,
		getSourceAudioTrackSettingsForClip,
		onSourceAudioTracksMetaChange,
		onSelectedClipSourceAudioTrackVolumeChange,
		onSelectedClipSourceAudioTrackNormalizeChange,
		embeddedSourcePreviewGain,
		getSourceTrackPreviewGain,
	};
}
