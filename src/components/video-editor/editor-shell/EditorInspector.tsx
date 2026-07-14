import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { InspectorTab } from "../inspectorRouting";

const TAB_ORDER: InspectorTab[] = ["design", "motion", "audio"];

export function EditorInspector({
	activeTab,
	onTabChange,
	labels,
	children,
}: {
	activeTab: InspectorTab;
	onTabChange: (tab: InspectorTab) => void;
	labels: Record<InspectorTab, string>;
	children: ReactNode;
}) {
	return (
		<aside className="work-surface order-3 flex h-full w-[344px] min-w-[300px] max-w-[344px] flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-border/70 shadow-sm">
			<div className="grid grid-cols-3 gap-1 border-b border-border/70 p-2">
				{TAB_ORDER.map((tab) => (
					<button
						key={tab}
						type="button"
						onClick={() => onTabChange(tab)}
						className={cn(
							"h-8 rounded-lg px-2 text-xs font-semibold text-muted-foreground transition-colors",
							activeTab === tab && "bg-brand/10 text-brand",
						)}
						aria-pressed={activeTab === tab}
					>
						{labels[tab]}
					</button>
				))}
			</div>
			<div className="min-h-0 flex-1 p-1.5">{children}</div>
		</aside>
	);
}
