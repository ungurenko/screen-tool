import { Gauge } from "@phosphor-icons/react";
import type { ReactElement } from "react";
import { useScopedT } from "@/contexts/I18nContext";
import {
	RECORDING_QUALITY_PRESETS,
	type RecordingQualityPresetId,
} from "@/lib/recordingPerformance";
import styles from "../LaunchWindow.module.css";
import { useLaunchPopoverCoordinator } from "./LaunchPopoverCoordinator";
import { HudPopover } from "./PopoverScaffold";

const POPOVER_ID = "quality";

export function QualityPopover({
	trigger,
	recordingQualityPreset,
	onSelectPreset,
}: {
	trigger: ReactElement;
	recordingQualityPreset: RecordingQualityPresetId;
	onSelectPreset: (preset: RecordingQualityPresetId) => void;
}) {
	const t = useScopedT("launch");
	const { isOpen, requestOpen, requestClose } = useLaunchPopoverCoordinator();
	const open = isOpen(POPOVER_ID);

	return (
		<HudPopover
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					requestClose(POPOVER_ID);
					return;
				}
				requestOpen(POPOVER_ID);
			}}
			trigger={trigger}
			align="center"
		>
			<div className={styles.ddLabel}>{t("recording.quality", "Качество записи")}</div>
			<div className="space-y-1">
				{RECORDING_QUALITY_PRESETS.map((preset) => {
					const selected = recordingQualityPreset === preset.id;
					return (
						<button
							key={preset.id}
							type="button"
							className={`${styles.ddItem} ${styles.ddItemStacked} ${
								selected ? styles.ddItemSelected : ""
							}`}
							onClick={() => {
								onSelectPreset(preset.id);
								requestClose(POPOVER_ID);
							}}
						>
							<span className="shrink-0 pt-0.5">
								<Gauge size={16} />
							</span>
							<span className="min-w-0 flex-1">
								<span className={styles.ddItemTitle}>{preset.label}</span>
								<span className={styles.ddItemMeta}>
									{preset.resolutionLabel} · {preset.frameRate} FPS
								</span>
							</span>
							<span className={styles.ddItemHint}>{preset.description}</span>
						</button>
					);
				})}
			</div>
		</HudPopover>
	);
}
