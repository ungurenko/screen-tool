import { CircleIcon, DotsThreeIcon, MinusIcon, MonitorIcon, XIcon } from "@phosphor-icons/react";
import type { ReactElement, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useScopedT } from "@/contexts/I18nContext";
import styles from "./LaunchWindow.module.css";
import type { DesktopSource } from "./popovers/launchPopoverTypes";

function PreflightSetting({
	icon,
	label,
	value,
	active,
}: {
	icon: ReactNode;
	label: string;
	value: string;
	active?: boolean;
}) {
	return (
		<button
			type="button"
			className={`${styles.preflightSetting} ${active ? styles.preflightSettingActive : ""} ${styles.electronNoDrag}`}
		>
			<span className={styles.preflightSettingIcon}>{icon}</span>
			<span className={styles.preflightSettingCopy}>
				<span>{label}</span>
				<strong>{value}</strong>
			</span>
		</button>
	);
}

export function createPreflightSettingTrigger(props: Parameters<typeof PreflightSetting>[0]) {
	return <PreflightSetting {...props} />;
}

export function PreflightCard({
	selectedSource,
	displayedSource,
	sourceTrigger,
	microphoneTrigger,
	webcamTrigger,
	countdownTrigger,
	qualityTrigger,
	moreTrigger,
	onStartRecording,
	onHide,
	onClose,
	disabled,
}: {
	selectedSource: DesktopSource | null;
	displayedSource: string;
	sourceTrigger: ReactElement;
	microphoneTrigger: ReactElement;
	webcamTrigger: ReactElement;
	countdownTrigger: ReactElement;
	qualityTrigger: ReactElement;
	moreTrigger: ReactElement;
	onStartRecording: () => void;
	onHide: () => void;
	onClose: () => void;
	disabled?: boolean;
}) {
	const t = useScopedT("launch");

	return (
		<section
			className={`${styles.preflightCard} launch-theme`}
			aria-label={t("recording.record")}
		>
			<header className={styles.preflightHeader}>
				<div className={styles.preflightTitleGroup}>
					<div className={styles.preflightAppMark}>
						<CircleIcon weight="fill" />
					</div>
					<div>
						<h1>{t("recording.record")}</h1>
						<p>{displayedSource}</p>
					</div>
				</div>
				<div className={`${styles.preflightWindowActions} ${styles.electronNoDrag}`}>
					{moreTrigger}
					<Button
						variant="ghost"
						size="icon"
						onClick={onHide}
						title={t("recording.hideHud")}
					>
						<MinusIcon size={16} />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						title={t("recording.closeApp")}
					>
						<XIcon size={16} />
					</Button>
				</div>
			</header>

			<div className={styles.preflightPreviewWrap}>
				{sourceTrigger}
				{selectedSource?.thumbnail ? (
					<img
						src={selectedSource.thumbnail}
						alt=""
						className={styles.preflightPreviewImage}
					/>
				) : (
					<div className={styles.preflightPreviewEmpty}>
						<MonitorIcon size={36} weight="light" />
					</div>
				)}
				<div className={styles.preflightPreviewLabel}>
					<span>{displayedSource}</span>
					<small>
						{selectedSource?.sourceType === "window"
							? t("recording.window")
							: t("recording.screen")}
					</small>
				</div>
			</div>

			<div className={styles.preflightSettings}>
				{microphoneTrigger}
				{webcamTrigger}
				{countdownTrigger}
				{qualityTrigger}
			</div>

			<Button
				variant="destructive"
				size="lg"
				className={`${styles.preflightRecordButton} ${styles.electronNoDrag}`}
				onClick={onStartRecording}
				disabled={disabled}
			>
				<span className={styles.preflightRecordDot} />
				{t("recording.record")}
			</Button>
		</section>
	);
}

export function PreflightMoreTrigger() {
	const t = useScopedT("launch");
	return (
		<Button variant="ghost" size="icon" title={t("recording.more")}>
			<DotsThreeIcon size={19} weight="bold" />
		</Button>
	);
}
