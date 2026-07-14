import { useCallback, useEffect, useState } from "react";
import { useScopedT } from "@/contexts/I18nContext";

export function CountdownOverlay() {
	const t = useScopedT("launch");
	const [countdown, setCountdown] = useState<number | null>(null);

	useEffect(() => {
		void window.electronAPI.getActiveCountdown().then((result) => {
			if (result.success && typeof result.seconds === "number") {
				setCountdown(result.seconds);
			}
		});

		const cleanup = window.electronAPI.onCountdownTick((seconds: number) => {
			setCountdown(seconds);
		});

		return cleanup;
	}, []);

	const handleCancel = useCallback(() => {
		window.electronAPI.cancelCountdown();
	}, []);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (event.key === "Escape") {
				handleCancel();
			}
		},
		[handleCancel],
	);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	if (countdown === null) {
		return null;
	}

	return (
		<button
			type="button"
			aria-label={t("recording.cancel", "Cancel")}
			className="group fixed inset-0 flex cursor-pointer select-none items-center justify-center border-0 bg-transparent p-0 text-foreground focus-visible:!outline-none"
			onClick={handleCancel}
		>
			<div className="liquid-glass relative flex size-[180px] items-center justify-center overflow-hidden rounded-[40px] transition-shadow group-focus-visible:ring-2 group-focus-visible:ring-brand/70 group-focus-visible:ring-offset-4">
				<div className="absolute inset-x-8 top-0 h-px bg-white/65" />
				<div className="absolute inset-3 rounded-[30px] border border-brand/10 bg-brand/[0.04]" />
				<span className="relative text-[96px] font-semibold leading-none tabular-nums tracking-[-0.06em] text-foreground drop-shadow-[0_10px_26px_hsl(var(--shadow-color)/0.18)]">
					{countdown}
				</span>
				<span className="sr-only">{t("recording.countdownDelay", "Countdown")}</span>
			</div>
		</button>
	);
}
