import {
	Gauge,
	MicrophoneIcon,
	MicrophoneSlashIcon,
	TimerIcon,
	VideoCameraIcon,
	VideoCameraSlashIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { RxDragHandleDots2 } from "react-icons/rx";
import { useScopedT } from "@/contexts/I18nContext";
import { useMicrophoneDevices } from "@/hooks/useMicrophoneDevices";
import { useScreenRecorder } from "@/hooks/useScreenRecorder";
import { useVideoDevices } from "@/hooks/useVideoDevices";
import { getRecordingCaptureProfile } from "@/lib/recordingPerformance";
import { HudInteractionContext } from "./contexts/HudInteractionContext";
import { FinalizingHud } from "./FinalizingHud";
import { canToggleFloatingWebcamPreview } from "./floatingWebcamPreview";
import { useHudBarDrag } from "./hooks/useHudBarDrag";
import { useLaunchHudInteractionState } from "./hooks/useLaunchHudInteractionState";
import { useLaunchWindowActions } from "./hooks/useLaunchWindowActions";
import { useLaunchWindowSystemState } from "./hooks/useLaunchWindowSystemState";
import { useRecordingTimer } from "./hooks/useRecordingTimer";
import { useWebcamPreviewOverlay } from "./hooks/useWebcamPreviewOverlay";
import styles from "./LaunchWindow.module.css";
import {
	createPreflightSettingTrigger,
	PreflightCard,
	PreflightMoreTrigger,
} from "./PreflightCard";
import { CountdownPopover } from "./popovers/CountdownPopover";
import {
	LaunchPopoverCoordinatorProvider,
	useLaunchPopoverCoordinator,
} from "./popovers/LaunchPopoverCoordinator";
import { MicPopover } from "./popovers/MicPopover";
import { MorePopover } from "./popovers/MorePopover";
import { ProjectPopover } from "./popovers/ProjectPopover";
import { QualityPopover } from "./popovers/QualityPopover";
import { SourcePopover } from "./popovers/SourcePopover";
import { WebcamPopover } from "./popovers/WebcamPopover";
import { RecordingMiniHud } from "./RecordingMiniHud";
import { resolveRecordingHudMode } from "./recordingHudMode";

const SHOW_DEV_UPDATE_PREVIEW = import.meta.env.DEV;

export function LaunchWindow() {
	return (
		<LaunchPopoverCoordinatorProvider>
			<LaunchWindowContent />
		</LaunchPopoverCoordinatorProvider>
	);
}

function LaunchWindowContent() {
	const t = useScopedT("launch");
	const { openId, requestClose, requestOpen } = useLaunchPopoverCoordinator();
	const {
		recording,
		paused,
		finalizing,
		countdownActive,
		toggleRecording,
		pauseRecording,
		resumeRecording,
		cancelRecording,
		microphoneEnabled,
		setMicrophoneEnabled,
		microphoneDeviceId,
		setMicrophoneDeviceId,
		systemAudioEnabled,
		setSystemAudioEnabled,
		webcamEnabled,
		setWebcamEnabled,
		webcamDeviceId,
		setWebcamDeviceId,
		countdownDelay,
		setCountdownDelay,
		recordingQualityPreset,
		setRecordingQualityPreset,
		preparePermissions,
	} = useScreenRecorder();
	const { elapsed, formatTime } = useRecordingTimer(recording, paused);
	const hudContentRef = useRef<HTMLDivElement>(null);
	const hudBarRef = useRef<HTMLDivElement>(null);

	const {
		selectedSource,
		selectedSourcePreview,
		hasSelectedSource,
		projectLibraryEntries,
		handleSourceSelect,
		openVideoFile,
		openProjectFromLibrary,
		syncSelectedSource,
		refreshProjectLibrary,
	} = useLaunchWindowActions();

	const { devices, selectedDeviceId, setSelectedDeviceId } = useMicrophoneDevices(
		microphoneEnabled || openId === "mic",
		microphoneDeviceId,
	);
	const {
		devices: videoDevices,
		selectedDeviceId: selectedVideoDeviceId,
		setSelectedDeviceId: setSelectedVideoDeviceId,
	} = useVideoDevices(webcamEnabled || openId === "webcam");

	const {
		hudOverlayMousePassthroughSupported,
		platform,
		appVersion,
		hideHudFromCapture,
		chooseRecordingsDirectory,
		toggleHudCaptureProtection,
	} = useLaunchWindowSystemState(preparePermissions);
	const supportsHudCaptureProtection = platform !== "linux";
	const displayedSelectedSource = hasSelectedSource ? selectedSource : t("recording.screen");
	const selectedQualityPreset = getRecordingCaptureProfile(recordingQualityPreset);
	const hudMode = resolveRecordingHudMode({ recording, paused, finalizing });
	const isPreflight = hudMode === "preflight";
	const isMiniHud = hudMode === "recording" || hudMode === "paused";

	useEffect(() => {
		if (!selectedDeviceId) return;
		setMicrophoneDeviceId(selectedDeviceId === "default" ? undefined : selectedDeviceId);
	}, [selectedDeviceId, setMicrophoneDeviceId]);

	useEffect(() => {
		if (selectedVideoDeviceId && selectedVideoDeviceId !== "default") {
			setWebcamDeviceId(selectedVideoDeviceId);
		}
	}, [selectedVideoDeviceId, setWebcamDeviceId]);

	useEffect(() => {
		let mounted = true;
		void window.electronAPI.getSelectedSource().then((source) => {
			if (mounted) syncSelectedSource(source);
		});
		const cleanup = window.electronAPI.onSelectedSourceChanged((source) => {
			if (mounted) syncSelectedSource(source);
		});
		return () => {
			mounted = false;
			cleanup?.();
		};
	}, [syncSelectedSource]);

	useEffect(() => {
		if (hudOverlayMousePassthroughSupported === false && isPreflight) {
			window.electronAPI?.hudOverlaySetIgnoreMouse?.(false);
		}
	}, [hudOverlayMousePassthroughSupported, isPreflight]);

	const showWebcamControls = webcamEnabled && !recording;
	const {
		showFloatingWebcamPreview,
		setShowFloatingWebcamPreview,
		showRecordingWebcamPreview,
		webcamPreviewOffset,
		recordingWebcamPreviewContainerRef,
		isWebcamPreviewDraggingRef,
		webcamPreviewDragStartRef,
		handleWebcamPreviewPointerDown,
		handleWebcamPreviewPointerMove,
		handleWebcamPreviewPointerUp,
		setWebcamPreviewNode,
		setRecordingWebcamPreviewNode,
	} = useWebcamPreviewOverlay({
		webcamEnabled,
		webcamDeviceId,
		showWebcamControls,
		webcamPopoverOpen: openId === "webcam",
		hudOverlayMousePassthroughSupported,
	});

	const {
		recordingHudOffset,
		hudBarTransformRef,
		isHudDraggingRef,
		handleHudBarPointerDown,
		handleHudBarPointerMove,
		handleHudBarPointerUp,
	} = useHudBarDrag({
		hudContentRef,
		hudBarRef,
		recordingWebcamPreviewContainerRef,
	});
	const { handleHudMouseEnter, handleHudMouseLeave, beginInteractiveHudAction } =
		useLaunchHudInteractionState({
			openId,
			keepInteractive: hudOverlayMousePassthroughSupported === false && isPreflight,
			isHudDraggingRef,
			isWebcamPreviewDraggingRef,
			webcamPreviewDragStartRef,
		});
	const useNativeHudBarDrag =
		platform === "linux" || hudOverlayMousePassthroughSupported === false;
	const transition = { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] as const };

	const sourceTrigger = (
		<button
			type="button"
			className={`${styles.preflightSourceTrigger} ${styles.electronNoDrag}`}
			aria-label={t("recording.screen")}
			title={displayedSelectedSource}
		/>
	);
	const micTrigger = createPreflightSettingTrigger({
		icon: microphoneEnabled ? <MicrophoneIcon /> : <MicrophoneSlashIcon />,
		label: t("recording.microphone"),
		value: microphoneEnabled
			? (devices.find((device) => device.deviceId === selectedDeviceId)?.label ??
				t("recording.microphone"))
			: systemAudioEnabled
				? t("recording.systemAudio", "System audio")
				: t("recording.off", "Off"),
		active: microphoneEnabled || systemAudioEnabled,
	});
	const webcamTrigger = createPreflightSettingTrigger({
		icon: webcamEnabled ? <VideoCameraIcon /> : <VideoCameraSlashIcon />,
		label: t("recording.webcam"),
		value: webcamEnabled
			? (videoDevices.find((device) => device.deviceId === selectedVideoDeviceId)?.label ??
				t("recording.webcam"))
			: t("recording.off", "Off"),
		active: webcamEnabled,
	});
	const countdownTrigger = createPreflightSettingTrigger({
		icon: <TimerIcon />,
		label: t("recording.countdownDelay"),
		value: countdownDelay > 0 ? `${countdownDelay}s` : t("recording.noDelay"),
		active: countdownDelay > 0,
	});
	const qualityTrigger = createPreflightSettingTrigger({
		icon: <Gauge />,
		label: t("recording.quality", "Recording quality"),
		value: `${selectedQualityPreset.resolutionLabel} · ${selectedQualityPreset.frameRate} FPS`,
		active: recordingQualityPreset !== "balanced",
	});

	const preflight = (
		<PreflightCard
			selectedSource={selectedSourcePreview}
			displayedSource={displayedSelectedSource}
			sourceTrigger={
				platform === "linux" ? (
					sourceTrigger
				) : (
					<SourcePopover
						selectedSource={displayedSelectedSource}
						onSourceSelect={handleSourceSelect}
						onOpen={beginInteractiveHudAction}
						trigger={sourceTrigger}
					/>
				)
			}
			microphoneTrigger={
				<MicPopover
					disabled={recording}
					systemAudioEnabled={systemAudioEnabled}
					onToggleSystemAudio={() => setSystemAudioEnabled(!systemAudioEnabled)}
					microphoneEnabled={microphoneEnabled}
					onDisableMicrophone={() => setMicrophoneEnabled(false)}
					devices={devices}
					microphoneDeviceId={microphoneDeviceId}
					selectedDeviceId={selectedDeviceId}
					onSelectDevice={(deviceId) => {
						setMicrophoneEnabled(true);
						setSelectedDeviceId(deviceId);
						setMicrophoneDeviceId(deviceId === "default" ? undefined : deviceId);
					}}
					trigger={micTrigger}
				/>
			}
			webcamTrigger={
				<WebcamPopover
					disabled={recording}
					webcamEnabled={webcamEnabled}
					onDisableWebcam={() => setWebcamEnabled(false)}
					canToggleFloatingPreview={canToggleFloatingWebcamPreview(
						hudOverlayMousePassthroughSupported,
					)}
					showFloatingWebcamPreview={showFloatingWebcamPreview}
					onToggleFloatingPreview={() =>
						setShowFloatingWebcamPreview((current) => !current)
					}
					showWebcamControls={showWebcamControls}
					setWebcamPreviewNode={setWebcamPreviewNode}
					videoDevices={videoDevices}
					webcamDeviceId={webcamDeviceId}
					selectedVideoDeviceId={selectedVideoDeviceId}
					onSelectVideoDevice={(deviceId) => {
						setWebcamEnabled(true);
						setSelectedVideoDeviceId(deviceId);
						setWebcamDeviceId(deviceId);
					}}
					trigger={webcamTrigger}
				/>
			}
			countdownTrigger={
				<CountdownPopover
					countdownDelay={countdownDelay}
					onSelectDelay={setCountdownDelay}
					trigger={countdownTrigger}
				/>
			}
			qualityTrigger={
				<QualityPopover
					recordingQualityPreset={recordingQualityPreset}
					onSelectPreset={setRecordingQualityPreset}
					trigger={qualityTrigger}
				/>
			}
			moreTrigger={
				<MorePopover
					supportsHudCaptureProtection={supportsHudCaptureProtection}
					hideHudFromCapture={hideHudFromCapture}
					onToggleHudCaptureProtection={() => void toggleHudCaptureProtection()}
					onChooseRecordingsDirectory={() => void chooseRecordingsDirectory()}
					onOpenVideoFile={() => void openVideoFile()}
					onOpenProjectBrowser={() => {
						void refreshProjectLibrary().then(() => requestOpen("projects"));
					}}
					showDevUpdatePreview={SHOW_DEV_UPDATE_PREVIEW}
					onPreviewUpdateUi={() => {
						if (openId) requestClose(openId);
						void window.electronAPI.previewUpdateToast().catch((error) => {
							console.warn("Failed to preview update toast:", error);
						});
					}}
					appVersion={appVersion}
					trigger={<PreflightMoreTrigger />}
				/>
			}
			onStartRecording={
				hasSelectedSource || platform === "linux"
					? toggleRecording
					: () => {
							beginInteractiveHudAction();
							requestOpen("sources");
						}
			}
			onHide={() => window.electronAPI?.hudOverlayHide?.()}
			onClose={() => window.electronAPI?.hudOverlayClose?.()}
			disabled={countdownActive}
		/>
	);

	return (
		<HudInteractionContext.Provider
			value={{ onMouseEnter: handleHudMouseEnter, onMouseLeave: handleHudMouseLeave }}
		>
			<div className="flex h-screen w-full items-end justify-center overflow-visible bg-transparent pb-5 pointer-events-none">
				<div
					ref={hudContentRef}
					className="flex flex-col-reverse items-center overflow-visible pointer-events-none"
				>
					<div
						className="flex flex-col items-center p-2 pointer-events-auto"
						onMouseEnter={handleHudMouseEnter}
						onMouseLeave={handleHudMouseLeave}
					>
						<div
							ref={hudBarTransformRef}
							style={{
								transform: isPreflight
									? undefined
									: `translate3d(${recordingHudOffset.x}px, ${recordingHudOffset.y}px, 0)`,
							}}
						>
							<AnimatePresence initial={false} mode="wait">
								<motion.div
									key={hudMode}
									ref={isPreflight ? undefined : hudBarRef}
									className={
										isPreflight
											? undefined
											: `${isMiniHud ? styles.miniHudShell : styles.finalizingShell} launch-theme`
									}
									initial={{ opacity: 0, y: 10, scale: 0.985 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									exit={{ opacity: 0, y: -8, scale: 0.985 }}
									transition={transition}
								>
									{!isPreflight ? (
										<div
											className={`flex cursor-grab items-center px-0.5 active:cursor-grabbing ${
												useNativeHudBarDrag ? styles.electronDrag : ""
											}`}
											onPointerDown={handleHudBarPointerDown}
											onPointerMove={handleHudBarPointerMove}
											onPointerUp={handleHudBarPointerUp}
											onPointerCancel={handleHudBarPointerUp}
										>
											<RxDragHandleDots2
												size={14}
												className="text-muted-foreground"
											/>
										</div>
									) : null}
									{isPreflight ? (
										preflight
									) : isMiniHud ? (
										<RecordingMiniHud
											paused={paused}
											microphoneEnabled={microphoneEnabled}
											elapsed={elapsed}
											onPauseResume={
												paused ? resumeRecording : pauseRecording
											}
											onStopRecording={toggleRecording}
											onHideHud={() => window.electronAPI?.hudOverlayHide?.()}
											onCancelRecording={cancelRecording}
											formatTime={formatTime}
										/>
									) : (
										<FinalizingHud />
									)}
								</motion.div>
							</AnimatePresence>
						</div>

						<div className="relative h-0 w-0">
							<ProjectPopover
								entries={projectLibraryEntries}
								onOpenProject={openProjectFromLibrary}
								trigger={
									<div className="absolute inset-0 opacity-0 pointer-events-none" />
								}
							/>
						</div>

						{showRecordingWebcamPreview ? (
							<div
								ref={recordingWebcamPreviewContainerRef}
								className={`${styles.recordingWebcamPreview} ${styles.electronNoDrag} pointer-events-auto`}
								data-hud-interactive
								title={t("recording.webcam")}
								style={{
									transform: `translate(${webcamPreviewOffset.x}px, ${webcamPreviewOffset.y}px)`,
								}}
								onPointerDown={handleWebcamPreviewPointerDown}
								onPointerMove={handleWebcamPreviewPointerMove}
								onPointerUp={handleWebcamPreviewPointerUp}
								onPointerCancel={handleWebcamPreviewPointerUp}
							>
								<video
									ref={setRecordingWebcamPreviewNode}
									className={styles.recordingWebcamPreviewVideo}
									muted
									playsInline
									style={{ transform: "scaleX(-1)" }}
								/>
							</div>
						) : null}
					</div>
				</div>
			</div>
		</HudInteractionContext.Provider>
	);
}
