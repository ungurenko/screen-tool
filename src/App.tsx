import { SpinnerGap } from "@phosphor-icons/react";
import { lazy, Suspense, useEffect, useState } from "react";
import { Toaster } from "./components/ui/sonner";
import { useI18n } from "./contexts/I18nContext";
import { ShortcutsProvider } from "./contexts/ShortcutsContext";

const CountdownOverlay = lazy(() =>
	import("./components/countdown/CountdownOverlay").then((module) => ({
		default: module.CountdownOverlay,
	})),
);
const LaunchWindow = lazy(() =>
	import("./components/launch/LaunchWindow").then((module) => ({
		default: module.LaunchWindow,
	})),
);
const SourceSelector = lazy(() =>
	import("./components/launch/SourceSelector").then((module) => ({
		default: module.SourceSelector,
	})),
);
const UpdateToastWindow = lazy(() =>
	import("./components/launch/UpdateToastWindow").then((module) => ({
		default: module.UpdateToastWindow,
	})),
);
const VideoEditor = lazy(() => import("./components/video-editor/VideoEditor"));
const ShortcutsConfigDialog = lazy(() =>
	import("./components/video-editor/ShortcutsConfigDialog").then((module) => ({
		default: module.ShortcutsConfigDialog,
	})),
);

function getInitialWindowType() {
	if (typeof window === "undefined") {
		return "";
	}

	return new URLSearchParams(window.location.search).get("windowType") || "";
}

export default function App() {
	const [windowType] = useState(getInitialWindowType);
	const { t } = useI18n();
	const isMacOS = /mac/i.test(navigator.platform);
	const appIconSrc = "/app-icons/screentool-128.png";
	const isTransparentWindow =
		windowType === "hud-overlay" ||
		windowType === "source-selector" ||
		windowType === "countdown" ||
		(windowType === "update-toast" && isMacOS);

	useEffect(() => {
		document.documentElement.dataset.windowType = windowType;

		if (isTransparentWindow) {
			document.body.style.background = "transparent";
			document.documentElement.style.background = "transparent";
			document.getElementById("root")?.style.setProperty("background", "transparent");
		}

		if (windowType === "hud-overlay") {
			document.documentElement.classList.add("hud-overlay-window");
			document.body.classList.add("hud-overlay-window");
			document.getElementById("root")?.classList.add("hud-overlay-window");
			window.electronAPI?.hudOverlaySetIgnoreMouse?.(true);
		} else if (windowType === "update-toast") {
			document.documentElement.style.overflow = "visible";
			document.body.style.overflow = "visible";
			document.getElementById("root")?.style.setProperty("overflow", "visible");
		}
	}, [isTransparentWindow, windowType]);

	useEffect(() => {
		if (windowType !== "editor") {
			return;
		}

		import("./lib/customFonts")
			.then(({ loadAllCustomFonts }) => loadAllCustomFonts())
			.catch((error) => {
				console.error("Failed to load custom fonts:", error);
			});
	}, [windowType]);

	useEffect(() => {
		document.title =
			windowType === "editor"
				? t("app.editorTitle", "ScreenTool Editor")
				: t("app.name", "ScreenTool");
	}, [windowType, t]);

	const content = (() => {
		switch (windowType) {
			case "hud-overlay":
				return (
					<>
						<LaunchWindow />
						<Toaster className="pointer-events-auto" />
					</>
				);
			case "source-selector":
				return <SourceSelector />;
			case "countdown":
				return <CountdownOverlay />;
			case "update-toast":
				return <UpdateToastWindow />;
			case "editor":
				return (
					<ShortcutsProvider>
						<VideoEditor />
						<ShortcutsConfigDialog />
					</ShortcutsProvider>
				);
			default:
				return (
					<div className="flex h-full w-full items-center justify-center bg-editor-bg p-6 text-foreground">
						<div className="work-surface flex items-center gap-4 rounded-[var(--radius-floating)] px-6 py-5">
							<img
								src={appIconSrc}
								alt={t("app.name", "ScreenTool")}
								className="h-12 w-12 rounded-xl"
							/>
							<div>
								<h1 className="text-xl font-semibold tracking-tight">
									{t("app.name", "ScreenTool")}
								</h1>
								<p className="text-sm text-foreground/65">
									{t("app.subtitle", "Screen recording and editing")}
								</p>
							</div>
						</div>
					</div>
				);
		}
	})();

	const loadingFallback = isTransparentWindow ? null : (
		<div className="flex h-full w-full items-center justify-center bg-editor-bg text-foreground">
			<div className="work-surface flex items-center gap-3 rounded-[var(--radius-panel)] px-5 py-4 text-sm font-medium text-muted-foreground">
				<SpinnerGap className="size-5 animate-spin text-brand" aria-hidden="true" />
				<span>{t("app.name", "ScreenTool")}</span>
			</div>
		</div>
	);

	return <Suspense fallback={loadingFallback}>{content}</Suspense>;
}
