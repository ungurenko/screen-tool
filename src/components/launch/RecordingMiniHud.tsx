import {
	DotsThreeIcon,
	MicrophoneIcon,
	MicrophoneSlashIcon,
	MinusIcon,
	PauseIcon,
	PlayIcon,
	SquareIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useScopedT } from "@/contexts/I18nContext";
import styles from "./LaunchWindow.module.css";
import { useLaunchPopoverCoordinator } from "./popovers/LaunchPopoverCoordinator";
import { DropdownItem, HudPopover } from "./popovers/PopoverScaffold";

const ACTIONS_POPOVER_ID = "recording-actions";

export function RecordingMiniHud({
	paused,
	microphoneEnabled,
	elapsed,
	onPauseResume,
	onStopRecording,
	onHideHud,
	onCancelRecording,
	formatTime,
}: {
	paused: boolean;
	microphoneEnabled: boolean;
	elapsed: number;
	onPauseResume: () => void;
	onStopRecording: () => void;
	onHideHud: () => void;
	onCancelRecording: () => void;
	formatTime: (seconds: number) => string;
}) {
	const t = useScopedT("launch");
	const { isOpen, requestOpen, requestClose } = useLaunchPopoverCoordinator();
	const open = isOpen(ACTIONS_POPOVER_ID);
	const formattedTime = useMemo(() => formatTime(elapsed), [elapsed, formatTime]);

	return (
		<div className={styles.miniHudControls}>
			<Button
				variant="destructive"
				size="icon"
				className={styles.miniHudStop}
				onClick={onStopRecording}
				title={t("recording.stop")}
				aria-label={t("recording.stop")}
			>
				<SquareIcon size={13} weight="fill" />
			</Button>

			<div className={styles.miniHudTimer}>
				<span className={paused ? styles.miniHudPausedDot : styles.miniHudRecordingDot} />
				<time>{formattedTime}</time>
				<small>{paused ? t("recording.paused") : t("recording.rec")}</small>
			</div>

			<div className={styles.miniHudDivider} />

			<Button
				variant={paused ? "secondary" : "ghost"}
				size="icon"
				onClick={onPauseResume}
				title={paused ? t("recording.resume") : t("recording.pause")}
				aria-label={paused ? t("recording.resume") : t("recording.pause")}
			>
				{paused ? (
					<PlayIcon size={17} weight="fill" />
				) : (
					<PauseIcon size={17} weight="fill" />
				)}
			</Button>

			<Button
				variant="ghost"
				size="icon"
				disabled
				title={t("recording.micToggleDisabledTip")}
				aria-label={t("recording.micToggleDisabledTip")}
			>
				{microphoneEnabled ? (
					<MicrophoneIcon size={17} />
				) : (
					<MicrophoneSlashIcon size={17} />
				)}
			</Button>

			<HudPopover
				open={open}
				onOpenChange={(nextOpen) =>
					nextOpen ? requestOpen(ACTIONS_POPOVER_ID) : requestClose(ACTIONS_POPOVER_ID)
				}
				align="end"
				trigger={
					<Button variant="ghost" size="icon" title={t("recording.more")}>
						<DotsThreeIcon size={19} weight="bold" />
					</Button>
				}
			>
				<DropdownItem
					icon={<MinusIcon size={16} />}
					onClick={() => {
						requestClose(ACTIONS_POPOVER_ID);
						onHideHud();
					}}
				>
					{t("recording.hideHud")}
				</DropdownItem>
				<button
					type="button"
					className={`${styles.ddItem} ${styles.miniHudCancelAction}`}
					onClick={() => {
						requestClose(ACTIONS_POPOVER_ID);
						onCancelRecording();
					}}
				>
					<TrashIcon size={16} />
					<span>{t("recording.cancel")}</span>
				</button>
			</HudPopover>
		</div>
	);
}
