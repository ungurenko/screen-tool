import { GearIcon } from "@phosphor-icons/react";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EditorEffectSection } from "../types";

export interface EditorModeRailItem {
	id: EditorEffectSection;
	label: string;
	icon: ComponentType<{ className?: string; weight?: "fill" | "regular" }>;
}

export function EditorModeRail({
	items,
	activeSection,
	onSelect,
	onOpenPreferences,
	preferencesLabel,
}: {
	items: EditorModeRailItem[];
	activeSection: EditorEffectSection;
	onSelect: (section: EditorEffectSection) => void;
	onOpenPreferences: () => void;
	preferencesLabel: string;
}) {
	return (
		<nav
			className="work-surface order-1 flex w-12 flex-shrink-0 flex-col items-center gap-1 rounded-2xl border border-border/70 p-1.5 shadow-sm"
			aria-label="Editor modes"
		>
			{items.map((item) => {
				const active = activeSection === item.id;
				const Icon = item.icon;
				return (
					<Button
						key={item.id}
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => onSelect(item.id)}
						title={item.label}
						aria-label={item.label}
						aria-pressed={active}
						className={cn(
							"h-9 w-9 rounded-xl text-muted-foreground",
							active && "bg-brand/10 text-brand hover:bg-brand/15 hover:text-brand",
						)}
					>
						<Icon className="h-[19px] w-[19px]" weight={active ? "fill" : "regular"} />
					</Button>
				);
			})}
			<div className="mt-auto pt-2">
				<Button
					type="button"
					variant="ghost"
					size="icon"
					onClick={onOpenPreferences}
					title={`${preferencesLabel} (⌘,)`}
					aria-label={preferencesLabel}
					className="h-9 w-9 rounded-xl text-muted-foreground"
				>
					<GearIcon className="h-[19px] w-[19px]" />
				</Button>
			</div>
		</nav>
	);
}
