import { AppWindowIcon, CaretUpIcon, MonitorIcon } from "@phosphor-icons/react";
import * as React from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useScopedT } from "@/contexts/I18nContext";
import { cn } from "@/lib/utils";
import {
	type DesktopSource,
	isScreenSource,
	isWindowSource,
	mapRawSource,
} from "./popovers/launchPopoverTypes";
import "./launchTheme.css";
import "./SourceSelector.css";
import { useHudInteraction } from "./contexts/HudInteractionContext";

interface SourceSelectorProps {
	/** List of available screen sources */
	screenSources?: DesktopSource[];
	/** List of available window sources */
	windowSources?: DesktopSource[];
	/** Currently selected source name */
	selectedSource?: string;
	/** Loading state */
	loading?: boolean;
	/** Callback when a source is selected */
	onSourceSelect?: (source: DesktopSource) => void;
	/** Callback to fetch sources */
	onFetchSources?: () => Promise<void>;
	/** Whether the popover is open */
	open?: boolean;
	/** Callback when open state changes */
	onOpenChange?: (open: boolean) => void;
	/** Optional custom trigger element */
	children?: React.ReactNode;
}

const noopSourceSelect = () => undefined;

export function MarqueeText({ text }: { text: string }) {
	const staticRef = useRef<HTMLSpanElement>(null);
	const [overflowing, setOverflowing] = useState(false);

	useLayoutEffect(() => {
		const node = staticRef.current;
		if (!node) return;
		const checkOverflow = () => {
			if (node.textContent !== text) return;
			setOverflowing(node.scrollWidth > node.clientWidth + 1);
		};
		checkOverflow();
		const observer = new ResizeObserver(checkOverflow);
		observer.observe(node);
		return () => observer.disconnect();
	}, [text]);

	return (
		<div
			className="w-full source-selector-marquee"
			data-overflowing={overflowing ? "true" : "false"}
		>
			<span ref={staticRef} className="source-selector-marquee-static">
				{text}
			</span>
			<span className="source-selector-marquee-animated">
				<span className="source-selector-marquee-track">
					<span className="source-selector-marquee-segment">{text}</span>
					<span className="source-selector-marquee-segment source-selector-marquee-duplicate">
						{text}
					</span>
				</span>
			</span>
		</div>
	);
}

/**
 * SourceSelectorContent - The actual list of sources
 */
export const SourceSelectorContent = ({
	screenSources = [],
	windowSources = [],
	selectedSource = "",
	loading = false,
	onSourceSelect = noopSourceSelect,
}: Pick<
	SourceSelectorProps,
	"screenSources" | "windowSources" | "selectedSource" | "loading" | "onSourceSelect"
>) => {
	const t = useScopedT("launch");
	const renderSourceItem = (source: DesktopSource, index: number) => {
		const isSelected = selectedSource === source.name;
		return (
			<button
				key={`${source.id}-${index}`}
				type="button"
				className={cn(
					"source-selector-item group relative min-w-0 overflow-hidden rounded-[12px] border border-transparent p-1.5 text-left font-medium",
					isSelected && "source-selector-item-selected",
				)}
				onClick={() => onSourceSelect(source)}
			>
				<div className="relative aspect-video w-full overflow-hidden rounded-[9px] bg-black/70">
					{source.thumbnail ? (
						<img
							src={source.thumbnail}
							alt=""
							className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.025]"
							onError={(e) => {
								(e.target as HTMLImageElement).style.display = "none";
							}}
						/>
					) : (
						<div className="source-selector-thumb-fallback flex h-full w-full items-center justify-center">
							{source.sourceType === "window" ? (
								<AppWindowIcon className="h-7 w-7 source-selector-muted" />
							) : (
								<MonitorIcon className="h-7 w-7 source-selector-muted" />
							)}
						</div>
					)}
					{source.appIcon ? (
						<img
							src={source.appIcon}
							alt=""
							className="absolute bottom-2 left-2 size-7 rounded-[7px] border border-white/20 bg-white/90 shadow-md"
						/>
					) : null}
				</div>

				<div className="flex min-w-0 flex-col items-start px-1 pb-1 pt-2 text-left">
					<div className="w-full text-xs font-semibold source-selector-text">
						<MarqueeText text={source.windowTitle || source.name} />
					</div>
					<div className="w-full truncate text-left text-[10px] source-selector-subtle">
						{source.sourceType === "screen"
							? t("recording.screen")
							: t("recording.window")}
					</div>
				</div>
			</button>
		);
	};

	const hasAnySources = screenSources.length > 0 || windowSources.length > 0;

	if (loading && !hasAnySources) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="animate-spin rounded-full h-5 w-5 border-b-2 source-selector-accent-border" />
			</div>
		);
	}

	return (
		<div className="max-h-[390px] overflow-y-auto overflow-x-hidden p-2 source-selector-scroll">
			{hasAnySources ? (
				<>
					{screenSources.length > 0 ? (
						<div className="space-y-1">
							<div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] source-selector-label flex items-center gap-2">
								{t("recording.screens")}
								<span
									className={cn(
										"normal-case tracking-normal text-[10px] source-selector-muted transition-opacity duration-150",
										loading ? "opacity-100" : "opacity-0",
									)}
								>
									{t("sourceSelector.refreshing", "Refreshing...")}
								</span>
							</div>
							<div className="grid grid-cols-2 gap-2">
								{screenSources.map((source, index) =>
									renderSourceItem(source, index),
								)}
							</div>
						</div>
					) : null}
					{windowSources.length > 0 ? (
						<div className="space-y-1">
							<div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] source-selector-label">
								{t("recording.windows")}
							</div>
							<div className="grid grid-cols-2 gap-2">
								{windowSources.map((source, index) =>
									renderSourceItem(source, index),
								)}
							</div>
						</div>
					) : null}
				</>
			) : (
				<div className="text-center py-8 text-sm source-selector-muted">
					{t("recording.noSourcesFound")}
				</div>
			)}
		</div>
	);
};

/**
 * SourceSelector - A rich source selection component with thumbnails
 * Uses Radix UI Popover for positioning and accessibility
 */
export const SourceSelector = React.memo(function SourceSelector({
	screenSources: propsScreenSources,
	windowSources: propsWindowSources,
	selectedSource: propsSelectedSource,
	loading: propsLoading,
	onSourceSelect: propsOnSourceSelect,
	onFetchSources: propsOnFetchSources,
	open: propsOpen,
	onOpenChange: propsOnOpenChange,
	children,
}: SourceSelectorProps) {
	// Internal state for standalone/uncontrolled use
	const [internalOpen, setInternalOpen] = useState(false);
	const [internalSources, setInternalSources] = useState<DesktopSource[]>([]);
	const [internalLoading, setInternalLoading] = useState(false);
	const [internalSelectedSource, setInternalSelectedSource] = useState("");

	// Determine if we should use internal or external state/logic
	const isAutonomous = propsOpen === undefined;
	const open = propsOpen ?? internalOpen;
	const onOpenChange = propsOnOpenChange ?? setInternalOpen;
	const loading = propsLoading ?? internalLoading;
	const selectedSource = propsSelectedSource ?? internalSelectedSource;

	// Default fetching logic
	const defaultFetchSources = useCallback(async () => {
		if (!window.electronAPI) return;
		setInternalLoading(true);
		try {
			const rawSources = await window.electronAPI.getSources({
				types: ["screen", "window"],
				thumbnailSize: { width: 160, height: 90 },
				fetchWindowIcons: true,
			});
			setInternalSources(rawSources.map((s) => mapRawSource(s as DesktopSource)));
		} catch (error) {
			console.error("Failed to fetch sources:", error);
		} finally {
			setInternalLoading(false);
		}
	}, []);

	const onFetchSources = propsOnFetchSources ?? defaultFetchSources;

	// Default selection logic
	const onSourceSelect = useCallback(
		async (source: DesktopSource) => {
			if (propsOnSourceSelect) {
				propsOnSourceSelect(source);
				return;
			}
			if (!window.electronAPI) return;
			try {
				const result = await window.electronAPI.selectSource(source);
				if (result) {
					setInternalSelectedSource(source.name);
				}
			} catch (error) {
				console.error("Failed to select source:", error);
			}
		},
		[propsOnSourceSelect],
	);

	// Split sources for internal use
	const internalScreenSources = useMemo(
		() => internalSources.filter(isScreenSource),
		[internalSources],
	);
	const internalWindowSources = useMemo(
		() => internalSources.filter(isWindowSource),
		[internalSources],
	);

	const screenSources = propsScreenSources ?? internalScreenSources;
	const windowSources = propsWindowSources ?? internalWindowSources;

	const hasPrefetchedRef = useRef(false);
	const fetchInFlightRef = useRef(false);
	const lastFetchedAtRef = useRef(0);

	const fetchSourcesOnce = useCallback(
		async (allowRecentSkip: boolean) => {
			if (fetchInFlightRef.current) {
				return;
			}
			if (allowRecentSkip && Date.now() - lastFetchedAtRef.current < 750) {
				return;
			}
			fetchInFlightRef.current = true;
			try {
				await onFetchSources();
				lastFetchedAtRef.current = Date.now();
			} finally {
				fetchInFlightRef.current = false;
			}
		},
		[onFetchSources],
	);

	const prefetchSources = React.useCallback(() => {
		if (hasPrefetchedRef.current) {
			return;
		}
		hasPrefetchedRef.current = true;
		void fetchSourcesOnce(false);
	}, [fetchSourcesOnce]);

	// Fetch sources when popover opens
	useEffect(() => {
		if (open) {
			void fetchSourcesOnce(true);
		}
	}, [open, fetchSourcesOnce]);

	// In autonomous mode, we might want to start open
	useEffect(() => {
		if (isAutonomous) {
			setInternalOpen(true);
		}
	}, [isAutonomous]);

	const trigger = children ? (
		React.isValidElement(children) ? (
			React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
				onPointerEnter: prefetchSources,
				onFocusCapture: prefetchSources,
			})
		) : (
			children
		)
	) : (
		<Button
			variant="outline"
			size="lg"
			onPointerEnter={prefetchSources}
			onFocusCapture={prefetchSources}
			className={cn(
				"group gap-2 px-3 min-w-0 max-w-[180px] rounded-[11px] font-medium text-[12px] [ -webkit-app-region:no-drag ] shrink-0",
				"border-[#2a2a34] bg-[#1a1a22] text-[#eeeef2] hover:border-[#3e3e4c] hover:bg-[#20202a] transition-all",
				"data-[state=open]:border-[#3e3e4c] data-[state=open]:bg-[#20202a]",
			)}
			title={selectedSource}
		>
			<MonitorIcon size={16} className="shrink-0" />
			<div className="flex-1 min-w-0">
				<MarqueeText text={selectedSource} />
			</div>
			<CaretUpIcon
				size={10}
				className={cn(
					"text-[#6b6b78] ml-0.5 shrink-0 transition-transform duration-200",
					open ? "" : "rotate-180",
				)}
			/>
		</Button>
	);

	const { onMouseEnter } = useHudInteraction();

	return (
		<Popover open={open} onOpenChange={onOpenChange} modal={false}>
			<PopoverTrigger asChild>{trigger}</PopoverTrigger>
			<PopoverContent
				className="launch-theme p-0 source-selector-popover"
				unstyled
				align="start"
				sideOffset={8}
				side="top"
				alignOffset={-8}
				avoidCollisions={true}
				collisionPadding={10}
				usePortal={false}
				onMouseEnter={onMouseEnter}
			>
				<SourceSelectorContent
					screenSources={screenSources}
					windowSources={windowSources}
					selectedSource={selectedSource}
					loading={loading}
					onSourceSelect={onSourceSelect}
				/>
			</PopoverContent>
		</Popover>
	);
});

SourceSelector.displayName = "SourceSelector";
