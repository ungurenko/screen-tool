import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	type CaptionSidecar,
	saveBlobExport,
	streamExportBlobToTempFile,
	writeSmokeExportReport,
} from "./exportSaveFlow";

type MockElectronApi = {
	openExportStream?: ReturnType<typeof vi.fn>;
	writeExportStreamChunk?: ReturnType<typeof vi.fn>;
	closeExportStream?: ReturnType<typeof vi.fn>;
	finalizeExportedVideo?: ReturnType<typeof vi.fn>;
	saveExportedVideo?: ReturnType<typeof vi.fn>;
	writeExportedVideoToPath?: ReturnType<typeof vi.fn>;
};

function installElectronApi(api: MockElectronApi) {
	vi.stubGlobal("window", { electronAPI: api });
}

async function readText(buffer: ArrayBuffer) {
	return new TextDecoder().decode(buffer);
}

describe("exportSaveFlow", () => {
	let warnSpy: ReturnType<typeof vi.spyOn>;
	let errorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("streams blob exports to a temp file before finalizing the save", async () => {
		const captionSidecar: CaptionSidecar = {
			format: "both",
			cues: [{ startMs: 0, endMs: 1000, text: "hello" }],
		};
		const api = {
			openExportStream: vi.fn(async () => ({
				success: true,
				streamId: "stream-1",
				tempPath: "/tmp/open.mp4",
			})),
			writeExportStreamChunk: vi.fn(async () => ({ success: true })),
			closeExportStream: vi.fn(async () => ({
				success: true,
				tempPath: "/tmp/final.mp4",
			})),
			finalizeExportedVideo: vi.fn(async () => ({
				success: true,
				path: "/Users/alex/export.mp4",
			})),
		};
		installElectronApi(api);

		const result = await saveBlobExport({
			blob: new Blob(["hello"]),
			fileName: "export-1.mp4",
			outputPath: "/Users/alex/export.mp4",
			captionSidecar,
		});

		expect(api.openExportStream).toHaveBeenCalledWith({ extension: "mp4" });
		expect(api.writeExportStreamChunk).toHaveBeenCalledTimes(1);
		const [streamId, position, chunk] = api.writeExportStreamChunk.mock.calls[0];
		expect(streamId).toBe("stream-1");
		expect(position).toBe(0);
		expect(new TextDecoder().decode(chunk)).toBe("hello");
		expect(api.closeExportStream).toHaveBeenCalledWith("stream-1");
		expect(api.finalizeExportedVideo).toHaveBeenCalledWith({
			tempPath: "/tmp/final.mp4",
			fileName: "export-1.mp4",
			outputPath: "/Users/alex/export.mp4",
			captionSidecar,
		});
		expect(result).toEqual({
			saveResult: { success: true, path: "/Users/alex/export.mp4" },
			pendingSave: {
				fileName: "export-1.mp4",
				tempFilePath: "/tmp/final.mp4",
				captionSidecar,
			},
		});
	});

	it("aborts an open stream when a chunk write fails", async () => {
		const api = {
			openExportStream: vi.fn(async () => ({
				success: true,
				streamId: "stream-1",
				tempPath: "/tmp/open.mp4",
			})),
			writeExportStreamChunk: vi.fn(async () => ({
				success: false,
				error: "disk full",
			})),
			closeExportStream: vi.fn(async () => ({ success: true })),
		};
		installElectronApi(api);

		await expect(streamExportBlobToTempFile(new Blob(["hello"]), "mp4")).rejects.toThrow(
			"disk full",
		);
		expect(api.closeExportStream).toHaveBeenCalledWith("stream-1", { abort: true });
	});

	it("falls back to in-memory save for small exports when stream IPC is unavailable", async () => {
		const api = {
			saveExportedVideo: vi.fn(async () => ({
				success: true,
				path: "/Users/alex/export.gif",
			})),
		};
		installElectronApi(api);

		const result = await saveBlobExport({
			blob: new Blob(["gif-bytes"]),
			fileName: "export-1.gif",
		});

		expect(api.saveExportedVideo).toHaveBeenCalledTimes(1);
		const [arrayBuffer, fileName] = api.saveExportedVideo.mock.calls[0];
		expect(await readText(arrayBuffer)).toBe("gif-bytes");
		expect(fileName).toBe("export-1.gif");
		expect(result.saveResult).toEqual({ success: true, path: "/Users/alex/export.gif" });
		expect(await readText(result.pendingSave.arrayBuffer!)).toBe("gif-bytes");
	});

	it("blocks MP4 in-memory fallback when temp-file streaming fails", async () => {
		const api = {
			openExportStream: vi.fn(async () => ({
				success: false,
				error: "stream unavailable",
			})),
			writeExportStreamChunk: vi.fn(),
			closeExportStream: vi.fn(),
		};
		installElectronApi(api);

		await expect(
			saveBlobExport({
				blob: new Blob(["mp4-bytes"]),
				fileName: "export-1.mp4",
			}),
		).rejects.toThrow("will not fall back");
		expect(errorSpy).toHaveBeenCalledWith(
			"[export] Refusing in-memory blob save fallback",
			expect.objectContaining({
				fileName: "export-1.mp4",
				extension: "mp4",
				hasExportStreamApi: true,
			}),
		);
	});

	it("writes smoke export reports next to the requested output path", async () => {
		const api = {
			writeExportedVideoToPath: vi.fn(async () => ({ success: true })),
		};
		installElectronApi(api);

		await writeSmokeExportReport("/tmp/export.mp4", {
			success: true,
			phase: "saved",
		});

		expect(api.writeExportedVideoToPath).toHaveBeenCalledTimes(1);
		const [arrayBuffer, outputPath] = api.writeExportedVideoToPath.mock.calls[0];
		expect(outputPath).toBe("/tmp/export.mp4.report.json");
		expect(JSON.parse(await readText(arrayBuffer))).toEqual({
			success: true,
			phase: "saved",
		});
	});

	it("swallows smoke report write failures", async () => {
		const api = {
			writeExportedVideoToPath: vi.fn(async () => {
				throw new Error("permission denied");
			}),
		};
		installElectronApi(api);

		await expect(writeSmokeExportReport("/tmp/export.mp4", {})).resolves.toBeUndefined();
		expect(errorSpy).toHaveBeenCalledWith(
			"[smoke-export] Failed to write report",
			expect.any(Error),
		);
		expect(warnSpy).not.toHaveBeenCalled();
	});
});
