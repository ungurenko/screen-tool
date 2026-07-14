import { CircleNotchIcon } from "@phosphor-icons/react";
import { useScopedT } from "@/contexts/I18nContext";
import styles from "./LaunchWindow.module.css";

export function FinalizingHud() {
	const t = useScopedT("launch");
	return (
		<div className={styles.finalizingState} role="status" aria-live="polite">
			<CircleNotchIcon size={19} className={styles.finalizingSpin} />
			<div className={styles.finalizingCopy}>
				<span>{t("recording.preparing", "Preparing recording")}</span>
				<small>{t("recording.preparingSubtitle", "Opening the editor in a moment")}</small>
			</div>
		</div>
	);
}
