import { FolderOpen } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useScopedT } from "@/contexts/I18nContext";
import { toFileUrl } from "@/lib/localFileUrl";

export type ProjectLibraryEntry = {
	path: string;
	name: string;
	updatedAt: number;
	thumbnailPath: string | null;
	isCurrent: boolean;
	isInProjectsDirectory: boolean;
};

type ProjectBrowserDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	entries: ProjectLibraryEntry[];
	onOpenProject: (projectPath: string) => void;
	onImportFile?: () => void;
	anchorRef?: React.RefObject<HTMLElement | null>;
	preferredDirection?: "up" | "down" | "auto";
	onPanelHeightChange?: (height: number) => void;
	renderMode?: "floating" | "inline";
};
export default function ProjectBrowserDialog({
	open,
	onOpenChange,
	entries,
	onOpenProject,
	onImportFile,
	anchorRef,
	preferredDirection = "auto",
	onPanelHeightChange,
	renderMode = "floating",
}: ProjectBrowserDialogProps) {
	const t = useScopedT("editor");
	const panelRef = useRef<HTMLDivElement | null>(null);
	const [position, setPosition] = useState({ top: 72, left: 16, maxHeight: 360 });
	const visibleEntries = useMemo(() => entries.slice(0, 24), [entries]);

	const updatePosition = useCallback(() => {
		if (typeof window === "undefined") {
			return;
		}

		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const margin = 12;
		const gap = 8;
		const fallbackMaxHeight = Math.min(360, viewportHeight - margin * 2);
		const panelWidth = Math.min(280, Math.max(248, viewportWidth - margin * 2));
		const panelHeight = panelRef.current?.offsetHeight ?? fallbackMaxHeight;
		const anchorRect = anchorRef?.current?.getBoundingClientRect();
		const availableAbove = anchorRect
			? Math.max(120, anchorRect.top - margin - gap)
			: fallbackMaxHeight;
		const availableBelow = anchorRect
			? Math.max(120, viewportHeight - anchorRect.bottom - margin - gap)
			: fallbackMaxHeight;
		const direction =
			preferredDirection === "auto"
				? availableAbove > availableBelow
					? "up"
					: "down"
				: preferredDirection;
		const maxHeight = Math.min(
			fallbackMaxHeight,
			direction === "up" ? availableAbove : availableBelow,
		);

		const nextTop = anchorRect
			? direction === "up"
				? Math.max(margin, anchorRect.top - Math.min(panelHeight, maxHeight) - gap)
				: Math.min(
						anchorRect.bottom + gap,
						Math.max(
							margin,
							viewportHeight - Math.min(panelHeight, maxHeight) - margin,
						),
					)
			: Math.min(
					56,
					Math.max(margin, viewportHeight - Math.min(panelHeight, maxHeight) - margin),
				);
		const alignedLeft = anchorRect
			? anchorRect.right - panelWidth
			: viewportWidth - panelWidth - 16;

		setPosition({
			top: Math.max(margin, nextTop),
			left: Math.max(margin, Math.min(alignedLeft, viewportWidth - panelWidth - margin)),
			maxHeight,
		});
	}, [anchorRef, preferredDirection]);

	useEffect(() => {
		if (!open) {
			return;
		}

		updatePosition();

		const handleViewportChange = () => updatePosition();
		window.addEventListener("resize", handleViewportChange);
		window.addEventListener("scroll", handleViewportChange, true);

		return () => {
			window.removeEventListener("resize", handleViewportChange);
			window.removeEventListener("scroll", handleViewportChange, true);
		};
	}, [open, updatePosition]);

	useEffect(() => {
		if (!open) {
			return;
		}

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target;
			if (!(target instanceof Node)) {
				return;
			}

			if (panelRef.current?.contains(target) || anchorRef?.current?.contains(target)) {
				return;
			}

			onOpenChange(false);
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onOpenChange(false);
			}
		};

		document.addEventListener("pointerdown", handlePointerDown);
		window.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [anchorRef, onOpenChange, open]);

	useEffect(() => {
		if (!open) {
			onPanelHeightChange?.(0);
			return;
		}

		onPanelHeightChange?.(panelRef.current?.offsetHeight ?? 0);

		if (!panelRef.current || !onPanelHeightChange || typeof ResizeObserver === "undefined") {
			return;
		}

		const observer = new ResizeObserver(() => {
			onPanelHeightChange(panelRef.current?.offsetHeight ?? 0);
		});
		observer.observe(panelRef.current);

		return () => {
			observer.disconnect();
			onPanelHeightChange(0);
		};
	}, [onPanelHeightChange, open]);

	if (!open) {
		return null;
	}

	if (renderMode === "inline") {
		return (
			<div
				ref={panelRef}
				role="dialog"
				aria-label={t("project.projects", "Projects")}
				className="work-surface pointer-events-auto mb-1.5 max-h-[400px] w-[300px] overflow-hidden rounded-[var(--radius-panel)] text-foreground animate-in fade-in-0 duration-150"
			>
				<div className="flex items-center justify-between gap-2 border-b border-foreground/10 px-3 py-2.5">
					<div className="text-sm font-medium tracking-tight text-foreground">
						{t("project.projects", "Projects")}
					</div>
					{onImportFile ? (
						<button
							type="button"
							onClick={onImportFile}
							className="rounded-[var(--radius-control)] px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-surface-control-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/35"
						>
							{t("project.import", "Import")}
						</button>
					) : null}
				</div>
				<div className="max-h-[360px] overflow-y-auto px-2.5 py-2.5">
					{visibleEntries.length > 0 ? (
						<div className="grid grid-cols-2 gap-2">
							{visibleEntries.map((entry) => {
								const thumbnailSrc = entry.thumbnailPath
									? toFileUrl(entry.thumbnailPath)
									: null;
								return (
									<button
										key={entry.path}
										type="button"
										onClick={() => onOpenProject(entry.path)}
										className="group flex flex-col gap-1 rounded-[var(--radius-control)] bg-transparent p-1 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-brand/45"
									>
										<div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-foreground/10 bg-editor-dialog-alt shadow-[0_4px_14px_hsl(var(--shadow-color)/0.1)] transition duration-200 group-hover:-translate-y-0.5 group-hover:border-brand/25 group-hover:shadow-[0_8px_20px_hsl(var(--shadow-color)/0.15)]">
											{thumbnailSrc ? (
												<img
													src={thumbnailSrc}
													alt=""
													className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
													draggable={false}
												/>
											) : (
												<div className="flex h-full w-full items-center justify-center bg-surface-control text-[10px] font-medium text-muted-foreground">
													{t("project.noPreview", "No preview yet")}
												</div>
											)}
											{entry.isCurrent ? (
												<div className="absolute right-1.5 top-1.5">
													<span className="rounded-md bg-brand px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_6px_16px_hsl(var(--accent)/0.24)]">
														{t("project.current", "Current")}
													</span>
												</div>
											) : null}
										</div>
										<div className="flex flex-1 flex-col px-0.5 py-0.5">
											<div className="truncate text-[11px] font-semibold tracking-tight text-foreground">
												{entry.name}
											</div>
										</div>
									</button>
								);
							})}
						</div>
					) : (
						<div className="flex min-h-[140px] flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-foreground/10 bg-editor-bg px-4 text-center">
							<div className="flex size-9 items-center justify-center rounded-xl bg-surface-control text-muted-foreground">
								<FolderOpen className="size-4" aria-hidden="true" />
							</div>
							<div className="text-sm font-semibold text-foreground">
								{t("project.noSavedProjects", "No saved projects yet")}
							</div>
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="pointer-events-none fixed inset-0 z-[90]">
			<div
				ref={panelRef}
				role="dialog"
				aria-label={t("project.projects", "Projects")}
				style={{ top: `${position.top}px`, left: `${position.left}px` }}
				className="liquid-glass pointer-events-auto fixed w-[min(280px,calc(100vw-24px))] overflow-hidden rounded-[var(--radius-floating)] text-foreground animate-in fade-in-0 duration-150"
			>
				<div className="flex items-center justify-between gap-2 border-b border-foreground/10 px-3 py-2.5">
					<div className="text-sm font-medium tracking-tight text-foreground">
						{t("project.projects", "Projects")}
					</div>
					{onImportFile ? (
						<button
							type="button"
							onClick={onImportFile}
							className="rounded-[var(--radius-control)] px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-surface-control-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/35"
						>
							{t("project.import", "Import")}
						</button>
					) : null}
				</div>
				<div
					className="overflow-y-auto px-2.5 py-2.5"
					style={{ maxHeight: `${position.maxHeight}px` }}
				>
					{visibleEntries.length > 0 ? (
						<div className="grid grid-cols-2 gap-2">
							{visibleEntries.map((entry) => {
								const thumbnailSrc = entry.thumbnailPath
									? toFileUrl(entry.thumbnailPath)
									: null;
								return (
									<button
										key={entry.path}
										type="button"
										onClick={() => onOpenProject(entry.path)}
										className="group flex flex-col gap-1 rounded-[var(--radius-control)] bg-transparent p-1 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-brand/45"
									>
										<div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-foreground/10 bg-editor-dialog-alt shadow-[0_4px_14px_hsl(var(--shadow-color)/0.1)] transition duration-200 group-hover:-translate-y-0.5 group-hover:border-brand/25 group-hover:shadow-[0_8px_20px_hsl(var(--shadow-color)/0.15)]">
											{thumbnailSrc ? (
												<img
													src={thumbnailSrc}
													alt=""
													className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
													draggable={false}
												/>
											) : (
												<div className="flex h-full w-full items-center justify-center bg-surface-control text-[10px] font-medium text-muted-foreground">
													{t("project.noPreview", "No preview yet")}
												</div>
											)}
											{entry.isCurrent ? (
												<div className="absolute right-1.5 top-1.5">
													<span className="rounded-md bg-brand px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_6px_16px_hsl(var(--accent)/0.24)]">
														{t("project.current", "Current")}
													</span>
												</div>
											) : null}
										</div>
										<div className="flex flex-1 flex-col px-0.5 py-0.5">
											<div className="truncate text-[11px] font-semibold tracking-tight text-foreground">
												{entry.name}
											</div>
										</div>
									</button>
								);
							})}
						</div>
					) : (
						<div className="flex min-h-[140px] flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-foreground/10 bg-editor-bg px-4 text-center">
							<div className="flex size-9 items-center justify-center rounded-xl bg-surface-control text-muted-foreground">
								<FolderOpen className="size-4" aria-hidden="true" />
							</div>
							<div className="text-sm font-semibold text-foreground">
								{t("project.noSavedProjects", "No saved projects yet")}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
