import type { CSSProperties, ReactNode } from "react";

export function EditorTopBar({ children }: { children: ReactNode }) {
	return (
		<header
			className="liquid-glass relative z-50 flex h-11 flex-shrink-0 items-center justify-between border-b border-border/70 px-5"
			style={{ WebkitAppRegion: "drag" } as CSSProperties}
		>
			{children}
		</header>
	);
}
