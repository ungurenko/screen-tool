import { describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({
	app: {
		getPath: () => "/tmp/screentool-test",
		getVersion: () => "1.4.0",
		isPackaged: true,
	},
	BrowserWindow: class BrowserWindow {},
	dialog: {
		showMessageBox: vi.fn(),
	},
}));

vi.mock("electron-updater", () => ({
	autoUpdater: {
		autoDownload: false,
		autoInstallOnAppQuit: false,
		checkForUpdates: vi.fn(),
		downloadUpdate: vi.fn(),
		on: vi.fn(),
		quitAndInstall: vi.fn(),
		setFeedURL: vi.fn(),
	},
}));

import { createInstallErrorToastPayload } from "./updater";

describe("updater install errors", () => {
	it("shows a Russian install failure message with a retry install action", () => {
		const payload = createInstallErrorToastPayload("1.4.1", new Error("signature rejected"));

		expect(payload.phase).toBe("error");
		expect(payload.primaryAction).toBe("retry-install");
		expect(payload.detail).toContain("Не удалось установить обновление");
		expect(payload.detail).toContain("signature rejected");
	});
});
