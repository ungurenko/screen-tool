import { describe, expect, it } from "vitest";
import { resolveInspectorRoute } from "./inspectorRouting";

describe("resolveInspectorRoute", () => {
	it("opens Motion for a selected zoom", () => {
		expect(
			resolveInspectorRoute({
				lastTab: "design",
				selectedZoomId: "zoom-1",
			}),
		).toEqual({ tab: "motion", section: "zoom" });
	});

	it("opens Motion for a selected clip", () => {
		expect(
			resolveInspectorRoute({
				lastTab: "design",
				selectedClipId: "clip-1",
			}),
		).toEqual({ tab: "motion", section: "clip" });
	});

	it("opens Audio for an audio region", () => {
		expect(
			resolveInspectorRoute({
				lastTab: "motion",
				selectedAudioId: "audio-1",
			}),
		).toEqual({ tab: "audio", section: "audio" });
	});

	it("opens Design for an annotation", () => {
		expect(
			resolveInspectorRoute({
				lastTab: "audio",
				selectedAnnotationId: "annotation-1",
			}),
		).toEqual({ tab: "design", section: "scene" });
	});

	it("keeps the last tab without a selection and defaults to Design", () => {
		expect(resolveInspectorRoute({ lastTab: "motion" })).toEqual({
			tab: "motion",
			section: "cursor",
		});
		expect(resolveInspectorRoute({})).toEqual({ tab: "design", section: "scene" });
	});
});
