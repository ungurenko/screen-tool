import { useEffect, useState } from "react";
import { extensionHost } from "@/lib/extensions";
import { ExtensionSettingsSection } from "./SettingsPanel";

type RegisteredSettingsPanel = ReturnType<typeof extensionHost.getSettingsPanels>[number];

export function StandaloneExtensionPreferences() {
	const [panels, setPanels] = useState<RegisteredSettingsPanel[]>(() =>
		extensionHost.getSettingsPanels().filter((panel) => !panel.panel.parentSection),
	);

	useEffect(() => {
		const update = () => {
			setPanels(
				extensionHost.getSettingsPanels().filter((panel) => !panel.panel.parentSection),
			);
		};
		return extensionHost.onChange(update);
	}, []);

	if (panels.length === 0) return null;

	return (
		<div className="w-[300px] flex-shrink-0 overflow-y-auto rounded-xl border border-border/70 bg-surface-panel p-4 custom-scrollbar">
			<div className="space-y-4">
				{panels.map((panel) => (
					<ExtensionSettingsSection
						key={`${panel.extensionId}/${panel.panel.id}`}
						extensionId={panel.extensionId}
						label={panel.panel.label}
						fields={panel.panel.fields}
					/>
				))}
			</div>
		</div>
	);
}
