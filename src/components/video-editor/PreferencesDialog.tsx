import {
	BugIcon,
	GlobeIcon,
	KeyboardIcon,
	PaletteIcon,
	PuzzlePieceIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n, useScopedT } from "@/contexts/I18nContext";
import { useShortcuts } from "@/contexts/ShortcutsContext";
import { useTheme } from "@/contexts/ThemeContext";
import type { AppLocale } from "@/i18n/config";
import { SUPPORTED_LOCALES } from "@/i18n/config";
import { APP_LANGUAGE_LABELS } from "@/i18n/localeMetadata";
import { cn } from "@/lib/utils";
import ExtensionManager from "./ExtensionManager";
import { StandaloneExtensionPreferences } from "./StandaloneExtensionPreferences";

const THEME_OPTIONS = ["light", "dark", "system"] as const;

export function PreferencesDialog({
	open,
	onOpenChange,
	nativeCaptureUnavailable,
	onOpenCaptureDiagnostics,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	nativeCaptureUnavailable: boolean;
	onOpenCaptureDiagnostics: () => void;
}) {
	const t = useScopedT("editor");
	const { preference, setPreference } = useTheme();
	const { locale, setLocale } = useI18n();
	const { openConfig } = useShortcuts();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex h-[min(720px,86vh)] w-[min(940px,92vw)] max-w-none flex-col overflow-hidden border-border/70 bg-editor-dialog p-0 shadow-2xl">
				<DialogHeader className="border-b border-border/70 px-6 py-5 text-left">
					<DialogTitle>{t("preferences.title", "Preferences")}</DialogTitle>
					<DialogDescription>
						{t(
							"preferences.description",
							"Appearance, shortcuts, extensions, and capture diagnostics.",
						)}
					</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue="general" className="flex min-h-0 flex-1 gap-0">
					<TabsList className="h-full w-48 flex-shrink-0 flex-col items-stretch justify-start gap-1 rounded-none border-r border-border/70 bg-surface-panel/70 p-3">
						<TabsTrigger value="general" className="justify-start gap-2">
							<PaletteIcon />
							{t("preferences.general", "General")}
						</TabsTrigger>
						<TabsTrigger value="shortcuts" className="justify-start gap-2">
							<KeyboardIcon />
							{t("preferences.shortcuts", "Shortcuts")}
						</TabsTrigger>
						<TabsTrigger value="extensions" className="justify-start gap-2">
							<PuzzlePieceIcon />
							{t("preferences.extensions", "Extensions")}
						</TabsTrigger>
						<TabsTrigger value="diagnostics" className="justify-start gap-2">
							<BugIcon />
							{t("preferences.diagnostics", "Diagnostics")}
						</TabsTrigger>
					</TabsList>

					<div className="min-h-0 flex-1 overflow-hidden p-6">
						<TabsContent value="general" className="m-0 space-y-6">
							<section className="space-y-3">
								<div>
									<h3 className="text-sm font-semibold text-foreground">
										{t("theme.appearance", "Appearance")}
									</h3>
									<p className="mt-1 text-xs text-muted-foreground">
										{t(
											"preferences.appearanceDescription",
											"Follow macOS automatically or choose a fixed theme.",
										)}
									</p>
								</div>
								<div className="grid max-w-md grid-cols-3 gap-2 rounded-xl border border-border/70 bg-surface-control/70 p-1">
									{THEME_OPTIONS.map((option) => (
										<button
											key={option}
											type="button"
											onClick={() => setPreference(option)}
											className={cn(
												"h-9 rounded-lg text-xs font-semibold text-muted-foreground transition-colors",
												preference === option &&
													"bg-background text-foreground shadow-sm",
											)}
										>
											{t(`theme.${option}`)}
										</button>
									))}
								</div>
							</section>

							<section className="max-w-md space-y-3">
								<div className="flex items-center gap-2">
									<GlobeIcon className="text-brand" />
									<h3 className="text-sm font-semibold text-foreground">
										{t("preferences.language", "Language")}
									</h3>
								</div>
								<Select
									value={locale}
									onValueChange={(value) => setLocale(value as AppLocale)}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{SUPPORTED_LOCALES.map((candidateLocale) => (
											<SelectItem
												key={candidateLocale}
												value={candidateLocale}
											>
												{APP_LANGUAGE_LABELS[candidateLocale]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</section>
						</TabsContent>

						<TabsContent value="shortcuts" className="m-0">
							<div className="max-w-xl rounded-2xl border border-border/70 bg-surface-panel p-5">
								<h3 className="text-sm font-semibold text-foreground">
									{t("preferences.shortcuts", "Shortcuts")}
								</h3>
								<p className="mt-1 text-xs leading-5 text-muted-foreground">
									{t(
										"preferences.shortcutsDescription",
										"Review and customize keyboard shortcuts used in the editor.",
									)}
								</p>
								<Button className="mt-4" onClick={openConfig}>
									<KeyboardIcon />
									{t("preferences.customizeShortcuts", "Customize shortcuts")}
								</Button>
							</div>
						</TabsContent>

						<TabsContent value="extensions" className="m-0 h-full">
							<div className="flex h-full min-h-0 gap-3">
								<ExtensionManager embedded />
								<StandaloneExtensionPreferences />
							</div>
						</TabsContent>

						<TabsContent value="diagnostics" className="m-0">
							<div className="max-w-xl rounded-2xl border border-border/70 bg-surface-panel p-5">
								<div className="flex items-start justify-between gap-6">
									<div>
										<h3 className="text-sm font-semibold text-foreground">
											{t(
												"preferences.captureDiagnostics",
												"Capture diagnostics",
											)}
										</h3>
										<p className="mt-1 text-xs leading-5 text-muted-foreground">
											{nativeCaptureUnavailable
												? t(
														"preferences.captureUnavailable",
														"Native capture is unavailable for this recording.",
													)
												: t(
														"preferences.captureAvailable",
														"No native capture issue is reported for this recording.",
													)}
										</p>
									</div>
									<span
										className={cn(
											"rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
											nativeCaptureUnavailable
												? "bg-destructive/10 text-destructive"
												: "bg-brand/10 text-brand",
										)}
									>
										{nativeCaptureUnavailable
											? t("preferences.issue", "Issue")
											: t("preferences.ready", "Ready")}
									</span>
								</div>
								<Button
									variant="outline"
									className="mt-4"
									onClick={onOpenCaptureDiagnostics}
								>
									<BugIcon />
									{t("preferences.openDiagnostics", "Open diagnostics")}
								</Button>
							</div>
						</TabsContent>
					</div>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
