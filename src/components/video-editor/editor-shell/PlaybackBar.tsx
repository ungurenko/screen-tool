import type { ReactNode } from "react";

export function PlaybackBar({ children }: { children: ReactNode }) {
	return (
		<div className="work-surface relative flex flex-shrink-0 items-center rounded-xl border border-border/70 px-2 py-1 shadow-sm">
			{children}
		</div>
	);
}
