export type RecordingQualityPresetId = "efficient" | "balanced" | "maximum";

export type RecordingCaptureProfile = {
	frameRate: number;
	minFrameRate: number;
	maxWidth: number;
	maxHeight: number;
	queueDepth: number;
	nativeVideoBitsPerSecond: number;
	recorderTimesliceMs: number;
	webcam: {
		width: number;
		height: number;
		frameRate: number;
		videoBitsPerSecond: number;
	};
};

export type RecordingQualityPreset = RecordingCaptureProfile & {
	id: RecordingQualityPresetId;
	label: string;
	description: string;
	resolutionLabel: string;
};

const COMMON_RECORDING_PROFILE = {
	minFrameRate: 24,
	queueDepth: 3,
	recorderTimesliceMs: 1000,
	webcam: {
		width: 960,
		height: 540,
		frameRate: 24,
		videoBitsPerSecond: 2_500_000,
	},
} as const;

export const RECORDING_QUALITY_PRESETS = [
	{
		id: "efficient",
		label: "Лёгкий",
		description: "Меньше нагрев и шум",
		resolutionLabel: "1080p",
		frameRate: 24,
		maxWidth: 1920,
		maxHeight: 1080,
		nativeVideoBitsPerSecond: 10_000_000,
		...COMMON_RECORDING_PROFILE,
	},
	{
		id: "balanced",
		label: "Сбалансированный",
		description: "Хорошее качество без лишней нагрузки",
		resolutionLabel: "1440p",
		frameRate: 30,
		maxWidth: 2560,
		maxHeight: 1440,
		nativeVideoBitsPerSecond: 16_000_000,
		...COMMON_RECORDING_PROFILE,
	},
	{
		id: "maximum",
		label: "Максимум",
		description: "Лучше детализация, выше нагрузка",
		resolutionLabel: "4K",
		frameRate: 60,
		maxWidth: 3840,
		maxHeight: 2160,
		nativeVideoBitsPerSecond: 45_000_000,
		minFrameRate: 30,
		queueDepth: 6,
		recorderTimesliceMs: 1000,
		webcam: {
			width: 1280,
			height: 720,
			frameRate: 30,
			videoBitsPerSecond: 8_000_000,
		},
	},
] as const satisfies readonly RecordingQualityPreset[];

export const DEFAULT_RECORDING_QUALITY_PRESET_ID: RecordingQualityPresetId = "balanced";

export const RECORDING_CAPTURE_PROFILE = {
	frameRate: 30,
	minFrameRate: 24,
	maxWidth: 2560,
	maxHeight: 1440,
	queueDepth: 3,
	nativeVideoBitsPerSecond: 16_000_000,
	recorderTimesliceMs: 1000,
	webcam: {
		width: 960,
		height: 540,
		frameRate: 24,
		videoBitsPerSecond: 2_500_000,
	},
} as const satisfies RecordingCaptureProfile;

const CODEC_ALIGNMENT = 2;
const FULL_HD_PIXELS = 1920 * 1080;
const QHD_PIXELS = RECORDING_CAPTURE_PROFILE.maxWidth * RECORDING_CAPTURE_PROFILE.maxHeight;
const BITRATE_SMALL = 8_000_000;
const BITRATE_FULL_HD = 10_000_000;
const BITRATE_QHD = 16_000_000;

export type RecordingDimensions = {
	width: number;
	height: number;
};

export type RecordingWorkloadEstimate = {
	bufferBytes: number;
	pixelsPerSecond: number;
};

export function normalizeRecordingQualityPresetId(value: unknown): RecordingQualityPresetId {
	const preset = RECORDING_QUALITY_PRESETS.find((candidate) => candidate.id === value);
	return preset?.id ?? DEFAULT_RECORDING_QUALITY_PRESET_ID;
}

export function getRecordingCaptureProfile(presetId?: unknown): RecordingQualityPreset {
	const normalizedPresetId = normalizeRecordingQualityPresetId(presetId);
	return (
		RECORDING_QUALITY_PRESETS.find((candidate) => candidate.id === normalizedPresetId) ??
		RECORDING_QUALITY_PRESETS[1]
	);
}

function alignForCodec(value: number): number {
	const rounded = Math.floor(value);
	return Math.max(CODEC_ALIGNMENT, rounded - (rounded % CODEC_ALIGNMENT));
}

export function constrainRecordingDimensions({
	height,
	maxHeight = RECORDING_CAPTURE_PROFILE.maxHeight,
	maxWidth = RECORDING_CAPTURE_PROFILE.maxWidth,
	width,
}: RecordingDimensions & { maxWidth?: number; maxHeight?: number }): RecordingDimensions {
	const safeWidth = Math.max(CODEC_ALIGNMENT, width);
	const safeHeight = Math.max(CODEC_ALIGNMENT, height);
	const widthScale = maxWidth > 0 ? maxWidth / safeWidth : 1;
	const heightScale = maxHeight > 0 ? maxHeight / safeHeight : 1;
	const scale = Math.min(1, widthScale, heightScale);

	return {
		width: alignForCodec(safeWidth * scale),
		height: alignForCodec(safeHeight * scale),
	};
}

export function computeBrowserRecordingBitrate({
	frameRate = RECORDING_CAPTURE_PROFILE.frameRate,
	height,
	width,
}: RecordingDimensions & { frameRate?: number }): number {
	const pixels = width * height;
	const baseBitrate =
		pixels >= QHD_PIXELS
			? BITRATE_QHD
			: pixels >= FULL_HD_PIXELS
				? BITRATE_FULL_HD
				: BITRATE_SMALL;
	const frameRateScale = Math.max(1, frameRate) / RECORDING_CAPTURE_PROFILE.frameRate;

	return Math.round(baseBitrate * frameRateScale);
}

export function estimateRecordingWorkload({
	bytesPerPixel = 4,
	frameRate,
	height,
	queueDepth,
	width,
}: RecordingDimensions & {
	frameRate: number;
	queueDepth: number;
	bytesPerPixel?: number;
}): RecordingWorkloadEstimate {
	return {
		bufferBytes: width * height * bytesPerPixel * queueDepth,
		pixelsPerSecond: width * height * frameRate,
	};
}
