import {
	WarningCircle as AlertCircle,
	DownloadSimple as Download,
	Spinner as LoaderCircle,
	Rocket,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useScopedT } from "@/contexts/I18nContext";

type UpdateToastPayload = {
	version: string;
	detail: string;
	phase: "available" | "downloading" | "ready" | "error";
	delayMs: number;
	isPreview?: boolean;
	progressPercent?: number;
	transferredBytes?: number;
	totalBytes?: number;
	remainingBytes?: number;
	bytesPerSecond?: number;
	primaryAction?: "install-and-restart" | "retry-check" | "retry-install";
};

const DEFAULT_REMINDER_DELAY_MS = 3 * 60 * 60 * 1000;

function formatBytes(value: number | undefined) {
	if (value === undefined || !Number.isFinite(value) || value <= 0) {
		return null;
	}

	const megabytes = value / (1024 * 1024);
	if (megabytes >= 1024) {
		return `${(megabytes / 1024).toFixed(1)} GB`;
	}

	return `${megabytes.toFixed(megabytes >= 100 ? 0 : 1)} MB`;
}

function getToastTitle(payload: UpdateToastPayload, t: ReturnType<typeof useScopedT>) {
	if (payload.isPreview) {
		return t("updateToast.previewTitle", "Update Prompt Preview");
	}

	switch (payload.phase) {
		case "available":
			return t("updateToast.availableTitle", "ScreenTool {{version}} is available", {
				version: payload.version,
			});
		case "downloading":
			return t("updateToast.downloadingTitle", "Installing ScreenTool {{version}}", {
				version: payload.version,
			});
		case "ready":
			return t("updateToast.readyTitle", "ScreenTool {{version}} is ready", {
				version: payload.version,
			});
		case "error":
			return payload.primaryAction === "retry-check"
				? t("updateToast.retryCheckErrorTitle", "Could not check for updates")
				: t("updateToast.attentionTitle", "ScreenTool {{version}} needs attention", {
						version: payload.version,
					});
	}
}

function getPrimaryButtonLabel(payload: UpdateToastPayload, t: ReturnType<typeof useScopedT>) {
	return payload.primaryAction === "retry-check" || payload.primaryAction === "retry-install"
		? t("updateToast.tryAgain", "Try Again")
		: t("updateToast.installAndRestart", "Install & Restart");
}

function getPhaseIcon(payload: UpdateToastPayload) {
	switch (payload.phase) {
		case "available":
			return <Download size={20} />;
		case "downloading":
			return <LoaderCircle size={20} className="animate-spin" />;
		case "ready":
			return <Rocket size={20} />;
		case "error":
			return <AlertCircle size={20} />;
	}
}

export function UpdateToastWindow() {
	const t = useScopedT("launch");
	const [payload, setPayload] = useState<UpdateToastPayload | null>(null);
	const [reminderDelayMs, setReminderDelayMs] = useState(DEFAULT_REMINDER_DELAY_MS);
	const reminderOptions = [
		{ label: t("updateToast.remindOneHour", "1 hour"), value: 1 * 60 * 60 * 1000 },
		{ label: t("updateToast.remindThreeHours", "3 hours"), value: 3 * 60 * 60 * 1000 },
		{ label: t("updateToast.remindTomorrow", "Tomorrow"), value: 24 * 60 * 60 * 1000 },
		{ label: t("updateToast.remindThreeDays", "3 days"), value: 3 * 24 * 60 * 60 * 1000 },
	];

	useEffect(() => {
		let mounted = true;
		let pollTimer: ReturnType<typeof setInterval> | null = null;

		void window.electronAPI.getCurrentUpdateToastPayload().then((nextPayload) => {
			if (mounted) {
				setPayload(nextPayload);
			}
		});

		pollTimer = setInterval(() => {
			void window.electronAPI.getCurrentUpdateToastPayload().then((nextPayload) => {
				if (mounted) {
					setPayload(nextPayload);
				}
			});
		}, 750);

		const dispose = window.electronAPI.onUpdateToastStateChanged((nextPayload) => {
			setPayload(nextPayload);
		});

		return () => {
			mounted = false;
			if (pollTimer) {
				clearInterval(pollTimer);
			}
			dispose();
		};
	}, []);

	useEffect(() => {
		if (!payload) {
			return;
		}

		setReminderDelayMs(payload.delayMs || DEFAULT_REMINDER_DELAY_MS);
	}, [payload]);

	const normalizedProgress = Math.max(
		0,
		Math.min(100, Math.round(payload?.progressPercent ?? 0)),
	);
	const downloadedLabel = formatBytes(payload?.transferredBytes);
	const totalLabel = formatBytes(payload?.totalBytes);
	const remainingLabel = formatBytes(payload?.remainingBytes);
	const speedLabel = formatBytes(payload?.bytesPerSecond);
	const phaseStats: Array<{ label: string; value: string }> = [];
	if (payload?.phase === "downloading") {
		if (downloadedLabel && totalLabel) {
			phaseStats.push({
				label: t("updateToast.downloaded", "Downloaded"),
				value: `${downloadedLabel} / ${totalLabel}`,
			});
		} else if (downloadedLabel) {
			phaseStats.push({
				label: t("updateToast.downloaded", "Downloaded"),
				value: downloadedLabel,
			});
		}
		if (remainingLabel) {
			phaseStats.push({ label: t("updateToast.left", "Left"), value: remainingLabel });
		}
		if (speedLabel) {
			phaseStats.push({ label: t("updateToast.speed", "Speed"), value: `${speedLabel}/s` });
		}
	}

	const handlePrimaryAction = async () => {
		if (!payload || payload.phase === "downloading") {
			return;
		}

		if (payload.primaryAction === "retry-check") {
			await window.electronAPI.checkForAppUpdates();
			return;
		}

		if (payload.primaryAction === "retry-install") {
			await window.electronAPI.installDownloadedUpdate();
			return;
		}

		if (payload.phase === "ready") {
			await window.electronAPI.installDownloadedUpdate();
			return;
		}

		await window.electronAPI.downloadAvailableUpdate(true);
	};

	const handleLater = async () => {
		if (!payload) {
			return;
		}

		if (payload.isPreview) {
			await window.electronAPI.dismissUpdateToast();
			return;
		}

		await window.electronAPI.deferDownloadedUpdate(reminderDelayMs);
	};

	if (!payload) {
		return <div className="h-full w-full bg-transparent" />;
	}

	return (
		<div className="launch-theme flex h-full w-full items-center justify-center bg-transparent p-2.5 font-sans text-foreground">
			<section
				aria-live="polite"
				className="liquid-glass flex w-full max-w-[440px] items-start gap-3.5 rounded-[24px] px-[18px] pb-4 pt-[18px]"
			>
				<div className="flex size-[42px] shrink-0 items-center justify-center rounded-2xl border border-brand/15 bg-brand/10 text-brand">
					{getPhaseIcon(payload)}
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<p className="m-0 text-[15px] font-semibold leading-tight tracking-[-0.015em] text-foreground">
							{getToastTitle(payload, t)}
						</p>
						{payload.isPreview ? (
							<span className="rounded-full border border-brand/20 bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
								{t("updateToast.devBadge", "Dev")}
							</span>
						) : null}
					</div>
					<p className="mb-0 mt-1.5 text-[13px] leading-[1.5] text-muted-foreground">
						{payload.detail}
					</p>

					{payload.phase === "downloading" ? (
						<div className="mt-3.5">
							<div
								role="progressbar"
								aria-valuemin={0}
								aria-valuemax={100}
								aria-valuenow={normalizedProgress}
								className="h-2 overflow-hidden rounded-full bg-surface-control"
							>
								<div
									className="h-full rounded-full bg-brand shadow-[0_0_18px_hsl(var(--accent)/0.3)] transition-[width] duration-300"
									style={{ width: `${normalizedProgress}%` }}
								/>
							</div>
							<div className="mt-2.5 flex flex-wrap gap-2">
								<span className="text-xs font-semibold text-foreground">
									{t("updateToast.completePercent", "{{percent}}% complete", {
										percent: normalizedProgress,
									})}
								</span>
								{phaseStats.map((stat) => (
									<span
										key={stat.label}
										className="rounded-full border border-brand/15 bg-brand/[0.08] px-2 py-1 text-[11px] font-medium text-brand"
									>
										{stat.label}: {stat.value}
									</span>
								))}
							</div>
						</div>
					) : null}

					<div className="mt-3.5 flex flex-wrap items-center gap-2.5">
						{payload.phase !== "downloading" ? (
							<>
								<button
									type="button"
									onClick={handlePrimaryAction}
									className="h-[38px] rounded-[var(--radius-control)] bg-brand px-3.5 text-[13px] font-semibold text-white shadow-[0_8px_20px_hsl(var(--accent)/0.2)] transition hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-brand/45"
								>
									{getPrimaryButtonLabel(payload, t)}
								</button>
								<select
									aria-label={t("updateToast.later", "Later")}
									value={String(reminderDelayMs)}
									onChange={(event) => {
										setReminderDelayMs(Number.parseInt(event.target.value, 10));
									}}
									className="h-[38px] cursor-pointer rounded-[var(--radius-control)] border border-border bg-surface-control px-3 text-[13px] font-medium text-foreground outline-none transition hover:bg-surface-control-hover focus-visible:ring-2 focus-visible:ring-brand/45"
								>
									{reminderOptions.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
								<button
									type="button"
									onClick={handleLater}
									className="h-[38px] rounded-[var(--radius-control)] border border-border bg-surface-control px-3.5 text-[13px] font-semibold text-foreground transition hover:bg-surface-control-hover focus-visible:ring-2 focus-visible:ring-brand/45"
								>
									{t("updateToast.later", "Later")}
								</button>
							</>
						) : null}
					</div>
				</div>
			</section>
		</div>
	);
}
