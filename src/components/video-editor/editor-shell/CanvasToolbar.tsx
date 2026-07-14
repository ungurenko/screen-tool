import type { ReactNode } from "react";

export function CanvasToolbar({ children }: { children: ReactNode }) {
	return (
		<div className="flex flex-shrink-0 items-center justify-center gap-2 py-1.5">
			{children}
		</div>
	);
}
