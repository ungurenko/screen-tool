import { describe, expect, it } from "vitest";
import { fromFileUrl, toFileUrl } from "./localFileUrl";

describe("local file URLs", () => {
	it.each([
		["macOS", "/Users/alex/Videos/demo.mp4", "file:///Users/alex/Videos/demo.mp4"],
		["Windows", "C:\\Users\\alex\\Videos\\demo.mp4", "file:///C:/Users/alex/Videos/demo.mp4"],
		[
			"UNC",
			"\\\\media-server\\shared folder\\demo.mp4",
			"file://media-server/shared%20folder/demo.mp4",
		],
	])("converts a %s path", (_platform, filePath, expectedUrl) => {
		expect(toFileUrl(filePath)).toBe(expectedUrl);
	});

	it("encodes spaces and literal percent signs", () => {
		expect(toFileUrl("/Users/alex/100% ready/demo clip.mp4")).toBe(
			"file:///Users/alex/100%25%20ready/demo%20clip.mp4",
		);
	});

	it.each([
		["/Users/alex/100% ready/demo clip.mp4", "/Users/alex/100% ready/demo clip.mp4"],
		["C:\\Users\\alex\\demo clip.mp4", "C:/Users/alex/demo clip.mp4"],
		[
			"\\\\media-server\\shared folder\\demo 100%.mp4",
			"\\\\media-server\\shared folder\\demo 100%.mp4",
		],
	])("round-trips %s", (filePath, expectedPath) => {
		expect(fromFileUrl(toFileUrl(filePath))).toBe(expectedPath);
	});

	it("leaves non-file URLs unchanged", () => {
		expect(fromFileUrl("https://example.com/demo.mp4")).toBe("https://example.com/demo.mp4");
	});
});
