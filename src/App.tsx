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
	const appIconSrc = "/app-icons/recordly-128.png";

	useEffect(() => {
		document.documentElement.dataset.windowType = windowType;

		if (
			windowType === "hud-overlay" ||
			windowType === "source-selector" ||
			windowType === "countdown" ||
			(windowType === "update-toast" && isMacOS)
		) {
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
	}, [isMacOS, windowType]);

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
				? t("app.editorTitle", "Recordly Editor")
				: t("app.name", "Recordly");
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
					<div className="flex h-full w-full items-center justify-center bg-editor-bg text-foreground">
						<div className="flex items-center gap-4 rounded-2xl border border-foreground/10 bg-foreground/5 px-6 py-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
							<img
								src={appIconSrc}
								alt={t("app.name", "Recordly")}
								className="h-12 w-12 rounded-xl"
							/>
							<div>
								<h1 className="text-xl font-semibold tracking-tight">
									{t("app.name", "Recordly")}
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

	return <Suspense fallback={null}>{content}</Suspense>;
}
