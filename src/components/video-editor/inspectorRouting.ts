import type { EditorEffectSection } from "./types";

export type InspectorTab = "design" | "motion" | "audio";

export interface InspectorSelection {
	lastTab?: InspectorTab;
	selectedZoomId?: string | null;
	selectedClipId?: string | null;
	selectedAudioId?: string | null;
	selectedAnnotationId?: string | null;
}

export interface InspectorRoute {
	tab: InspectorTab;
	section: EditorEffectSection;
}

export function getDefaultInspectorSection(tab: InspectorTab): EditorEffectSection {
	switch (tab) {
		case "motion":
			return "cursor";
		case "audio":
			return "audio";
		case "design":
			return "scene";
	}
}

export function getInspectorTabForSection(section: EditorEffectSection): InspectorTab | null {
	if (section === "zoom" || section === "clip" || section === "cursor") {
		return "motion";
	}
	if (section === "audio") {
		return "audio";
	}
	if (
		section === "scene" ||
		section === "frame" ||
		section === "crop" ||
		section === "captions" ||
		section === "webcam"
	) {
		return "design";
	}
	return null;
}

export function resolveInspectorRoute(selection: InspectorSelection): InspectorRoute {
	if (selection.selectedAudioId) {
		return { tab: "audio", section: "audio" };
	}
	if (selection.selectedZoomId) {
		return { tab: "motion", section: "zoom" };
	}
	if (selection.selectedClipId) {
		return { tab: "motion", section: "clip" };
	}
	if (selection.selectedAnnotationId) {
		return { tab: "design", section: "scene" };
	}

	const tab = selection.lastTab ?? "design";
	return { tab, section: getDefaultInspectorSection(tab) };
}
