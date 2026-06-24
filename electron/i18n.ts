import { readFileSync } from "node:fs";
import path from "node:path";
import { app } from "electron";

const LOCALE_STORAGE_KEY = "screentool.locale";

type ElectronLocale = "en" | "ru";

const dictionaries: Record<ElectronLocale, Record<string, string>> = {
	en: {
		"menu.file": "File",
		"menu.openProjects": "Open Projects...",
		"menu.saveProject": "Save Project...",
		"menu.saveProjectAs": "Save Project As...",
		"menu.edit": "Edit",
		"menu.view": "View",
		"menu.window": "Window",
		"menu.help": "Help",
		"menu.checkForUpdates": "Check for Updates...",
		"tray.recording": "Recording: {{source}}",
		"tray.showControls": "Show Controls",
		"tray.stopRecording": "Stop Recording",
		"tray.open": "Open",
		"tray.quit": "Quit",
		"updates.notification.availableTitle": "ScreenTool {{version}} is available",
		"updates.notification.downloadingTitle": "Downloading ScreenTool {{version}}",
		"updates.notification.readyTitle": "ScreenTool {{version}} is ready",
		"updates.notification.errorTitle": "ScreenTool {{version}} needs attention",
		"updates.notification.availableBody": "Click to install the update and restart ScreenTool.",
		"updates.notification.downloadingBody":
			"ScreenTool is downloading the update and will restart when it is ready.",
		"updates.notification.readyBody": "Click to install the downloaded update and restart.",
		"updates.notification.installRetryBody": "Click to try the install again.",
		"updates.notification.checkRetryBody": "Click to retry checking for updates.",
		"updates.availableDetail":
			"Install the latest version now, or remind yourself to come back to it later.",
		"updates.downloadFinishing":
			"Finishing the update download. ScreenTool will restart as soon as the installer is ready.",
		"updates.downloadRemaining": "{{mb}} MB left before ScreenTool restarts.",
		"updates.downloadingDetail":
			"Downloading the update now. ScreenTool will restart when it finishes.",
		"updates.readyDetail":
			"The update is ready. Install and restart now, or remind yourself later.",
		"updates.errorDetail": "The update could not be downloaded. {{error}}",
		"updates.noReadyDownload": "No update is ready to download.",
		"updates.alreadyDownloaded": "This update has already been downloaded.",
		"updates.alreadyDownloading": "This update is already downloading.",
		"updates.noReminder": "No update reminder is ready yet.",
		"updates.noSkipAvailable": "No update is available to skip.",
		"updates.previewDetail": "This is a development preview of the in-app update toast.",
		"updates.previewReadyDetail":
			"Development preview: the update is ready to install. No real update will be installed.",
		"updates.availableTitle": "Update Available",
		"updates.availableMessage": "ScreenTool {{version}} is available.",
		"updates.availableDialogDetail": "Install and restart now, or remind me later.",
		"updates.readyTitle": "Update Ready",
		"updates.readyMessage": "ScreenTool {{version}} has been downloaded.",
		"updates.readyPreviewMessage": "ScreenTool {{version}} is ready to install.",
		"updates.readyPreviewDetail":
			"Development preview of the native update prompt. No real update will be installed.",
		"updates.previewOnlyTitle": "Preview Only",
		"updates.previewOnlyMessage": "No real update was installed.",
		"updates.previewOnlyDetail":
			"This was only a manual development preview of the update prompt.",
		"updates.installRestart": "Install & Restart",
		"updates.later": "Later",
		"updates.notEnabledTitle": "Updates Not Enabled",
		"updates.notEnabledMessage": "Auto-updates are only available in packaged releases.",
		"updates.disabledDetail":
			"This local build disables auto-updates by default. Configure your own update feed, then set SCREENTOOL_ENABLE_AUTO_UPDATES=1.",
		"updates.feedUrlDetail":
			"Set SCREENTOOL_UPDATE_FEED_URL to your own update feed before enabling packaged auto-updates.",
		"updates.checking": "Checking for updates...",
		"updates.availableSummary": "ScreenTool {{version}} is available.",
		"updates.readySummary": "ScreenTool {{version}} is ready to install.",
		"updates.upToDateSummary": "ScreenTool {{version}} is up to date.",
		"updates.downloadingSummary": "Downloading ScreenTool {{version}}",
		"unsaved.buttons.save": "Save & Close",
		"unsaved.buttons.discard": "Discard & Close",
		"unsaved.buttons.cancel": "Cancel",
		"unsaved.title": "Unsaved Changes",
		"unsaved.message": "You have unsaved changes.",
		"unsaved.detail": "Do you want to save your project before closing?",
		"files.importMediaOrProject": "Import Media or ScreenTool Project",
		"files.selectVideo": "Select Video File",
		"files.mediaOrProjects": "Media or ScreenTool Projects",
		"files.videoFiles": "Video Files",
		"files.screentoolProjects": "ScreenTool Projects",
		"files.allFiles": "All Files",
		"files.selectAudio": "Select Audio File",
		"files.audioFiles": "Audio Files",
		"files.selectWhisperExecutable": "Select Whisper Executable",
		"files.executables": "Executables",
		"files.selectWhisperModel": "Select Whisper Model",
		"files.whisperModels": "Whisper Models",
		"files.failedOpenPicker": "Failed to open file picker",
		"files.failedOpenAudioPicker": "Failed to open audio file picker",
		"export.gifImage": "GIF Image",
		"export.mp4Video": "MP4 Video",
		"export.saveGif": "Save Exported GIF",
		"export.saveVideo": "Save Exported Video",
		"export.canceled": "Export canceled",
		"export.videoExported": "Video exported successfully",
		"export.failedSaveVideo": "Failed to save exported video",
		"export.tooLarge":
			"Export is too large for the legacy in-memory save path. Please retry with temp-file streaming enabled.",
		"export.captionSidecarFailed": "Captions could not be saved alongside the video.",
		"project.nameAlreadyUsed": "A different project already uses this name.",
		"project.unableToVerifyName": "Unable to verify project identity for the chosen name.",
		"project.revealFallback": "Could not reveal item, but opened directory.",
		"project.openRecordingsFolderFailed": "Failed to open recordings folder.",
		"project.chooseRecordingsFolder": "Choose recordings folder",
		"project.setRecordingsFolderFailed": "Failed to set recordings folder",
		"project.saved": "Project saved successfully",
		"project.pathNoLongerTrusted": "Project path is no longer trusted. Please use Save As.",
		"project.saveScreenToolProject": "Save ScreenTool Project",
		"project.screentoolProject": "ScreenTool Project",
		"project.saveCanceled": "Save project canceled",
		"project.saveFailed": "Failed to save project file",
		"project.nameRequired": "Project name is required",
		"project.openScreenToolProject": "Open ScreenTool Project",
		"project.openCanceled": "Open project canceled",
		"project.loadFailed": "Failed to load project file",
		"project.noActiveProject": "No active project",
		"project.loadCurrentFailed": "Failed to load current project file",
		"project.openFileFailed": "Failed to open project file",
		"project.openProjectsFolderFailed": "Failed to open projects folder.",
		"recording.screenPermissionTitle": "Screen Recording Permission Required",
		"recording.screenPermissionMessage":
			"ScreenTool needs screen recording permission to capture your screen.",
		"recording.screenPermissionDetail":
			"Please open System Settings > Privacy & Security > Screen Recording, make sure ScreenTool is toggled ON, then try recording again.",
		"recording.microphonePermissionTitle": "Microphone Permission Required",
		"recording.microphonePermissionMessage":
			"ScreenTool needs microphone permission to record audio.",
		"recording.microphonePermissionDetail":
			"Please open System Settings > Privacy & Security > Microphone, make sure ScreenTool is toggled ON, then try recording again.",
		"recording.openSystemSettings": "Open System Settings",
		"recording.cancel": "Cancel",
		"recording.screenPermissionDenied":
			"Screen recording permission not granted. Please allow access in System Settings and restart the app.",
		"recording.microphonePermissionDenied":
			"Microphone permission not granted. Please allow access in System Settings.",
		"recording.nativeStartFailed": "Failed to start native ScreenCaptureKit recording",
		"recording.windowsUnavailable": "Native Windows capture is not available on this system.",
		"recording.windowsAlreadyActive": "A native Windows screen recording is already active.",
		"recording.selectedWindowUnavailable":
			"Selected window is no longer available. Please choose the window again.",
		"recording.windowsStartFailed": "Failed to start native Windows capture",
		"recording.nativeOnlyMac": "Native screen recording is only available on macOS.",
		"recording.nativeAlreadyActive": "A native screen recording is already active.",
		"recording.windowsStopFailed": "Failed to stop native Windows capture",
		"recording.nativeNotActive": "No native screen recording is active.",
		"recording.macStopFailed": "Failed to stop native ScreenCaptureKit recording",
		"recording.macRecoveryOnly": "Native screen recording recovery is only available on macOS.",
		"recording.macRecoverableOutputMissing":
			"No recoverable native macOS recording output was found.",
		"recording.windowsNotActive": "No native Windows screen recording is active.",
		"recording.windowsPauseFailed": "Failed to pause native Windows capture",
		"recording.nativePauseFailed": "Failed to pause native screen recording",
		"recording.windowsResumeFailed": "Failed to resume native Windows capture",
		"recording.nativeResumeFailed": "Failed to resume native screen recording",
		"recording.windowsMuxPendingMissing": "No native Windows video pending for mux",
		"recording.windowsMuxFailed": "Failed to mux native Windows recording",
		"recording.ffmpegAlreadyActive": "An FFmpeg recording is already active.",
		"recording.ffmpegStartFailed": "Failed to start FFmpeg recording",
		"recording.ffmpegNotActive": "No FFmpeg recording is active.",
		"recording.ffmpegStopFailed": "Failed to stop FFmpeg recording",
		"recording.storeVideoFailed": "Failed to store video",
		"recording.noRecordedVideo": "No recorded video found",
		"recording.noUsableRecordedVideo": "No usable recorded video found",
		"recording.getVideoPathFailed": "Failed to get video path",
		"recording.cursorTelemetryLoadFailed": "Failed to load cursor telemetry",
		"recording.cursorTelemetryNoVideoPath": "No video path available for cursor telemetry",
		"recording.cursorTelemetrySaveFailed": "Failed to save cursor telemetry",
		"captions.generated": "Generated {{count}} caption cues.",
		"captions.generatedFromSource": "Generated {{count}} caption cues from the {{source}}.",
		"captions.generateFailed": "Failed to generate auto captions",
		"system.screen": "Screen",
		"system.screenNumber": "Screen {{number}}",
		"system.screenNumberPrimary": "Screen {{number}} (Primary)",
		"system.entireScreen": "Entire screen",
	},
	ru: {
		"menu.file": "Файл",
		"menu.openProjects": "Открыть проекты...",
		"menu.saveProject": "Сохранить проект...",
		"menu.saveProjectAs": "Сохранить проект как...",
		"menu.edit": "Правка",
		"menu.view": "Вид",
		"menu.window": "Окно",
		"menu.help": "Помощь",
		"menu.checkForUpdates": "Проверить обновления...",
		"tray.recording": "Запись: {{source}}",
		"tray.showControls": "Показать управление",
		"tray.stopRecording": "Остановить запись",
		"tray.open": "Открыть",
		"tray.quit": "Выйти",
		"updates.notification.availableTitle": "Доступна версия ScreenTool {{version}}",
		"updates.notification.downloadingTitle": "Загрузка ScreenTool {{version}}",
		"updates.notification.readyTitle": "ScreenTool {{version}} готова к установке",
		"updates.notification.errorTitle": "ScreenTool {{version}} требует внимания",
		"updates.notification.availableBody":
			"Нажмите, чтобы установить обновление и перезапустить ScreenTool.",
		"updates.notification.downloadingBody":
			"ScreenTool загружает обновление и перезапустится, когда оно будет готово.",
		"updates.notification.readyBody":
			"Нажмите, чтобы установить загруженное обновление и перезапустить приложение.",
		"updates.notification.installRetryBody": "Нажмите, чтобы повторить установку.",
		"updates.notification.checkRetryBody": "Нажмите, чтобы снова проверить обновления.",
		"updates.availableDetail": "Установите свежую версию сейчас или попросите напомнить позже.",
		"updates.downloadFinishing":
			"Загрузка обновления завершается. ScreenTool перезапустится, когда установщик будет готов.",
		"updates.downloadRemaining": "Осталось {{mb}} МБ до перезапуска ScreenTool.",
		"updates.downloadingDetail":
			"Обновление загружается. ScreenTool перезапустится после завершения.",
		"updates.readyDetail":
			"Обновление готово. Установите его сейчас или попросите напомнить позже.",
		"updates.errorDetail": "Не удалось загрузить обновление. {{error}}",
		"updates.noReadyDownload": "Нет обновления, готового к загрузке.",
		"updates.alreadyDownloaded": "Это обновление уже загружено.",
		"updates.alreadyDownloading": "Это обновление уже загружается.",
		"updates.noReminder": "Напоминание об обновлении пока недоступно.",
		"updates.noSkipAvailable": "Нет обновления, которое можно пропустить.",
		"updates.previewDetail": "Это тестовый предпросмотр окна обновления.",
		"updates.previewReadyDetail":
			"Тестовый режим: обновление готово к установке. Реальное обновление установлено не будет.",
		"updates.availableTitle": "Доступно обновление",
		"updates.availableMessage": "Доступна версия ScreenTool {{version}}.",
		"updates.availableDialogDetail": "Установите и перезапустите сейчас или напомнить позже.",
		"updates.readyTitle": "Обновление готово",
		"updates.readyMessage": "ScreenTool {{version}} загружена.",
		"updates.readyPreviewMessage": "ScreenTool {{version}} готова к установке.",
		"updates.readyPreviewDetail":
			"Тестовое системное окно обновления. Реальное обновление установлено не будет.",
		"updates.previewOnlyTitle": "Только предпросмотр",
		"updates.previewOnlyMessage": "Реальное обновление не устанавливалось.",
		"updates.previewOnlyDetail": "Это был ручной тестовый предпросмотр окна обновления.",
		"updates.installRestart": "Установить и перезапустить",
		"updates.later": "Позже",
		"updates.notEnabledTitle": "Обновления не включены",
		"updates.notEnabledMessage": "Автообновления доступны только в собранных релизах.",
		"updates.disabledDetail":
			"В этой локальной сборке автообновления по умолчанию выключены. Настройте свой канал обновлений и задайте SCREENTOOL_ENABLE_AUTO_UPDATES=1.",
		"updates.feedUrlDetail":
			"Перед включением автообновлений укажите свой канал обновлений в SCREENTOOL_UPDATE_FEED_URL.",
		"updates.checking": "Проверка обновлений...",
		"updates.availableSummary": "Доступна версия ScreenTool {{version}}.",
		"updates.readySummary": "ScreenTool {{version}} готова к установке.",
		"updates.upToDateSummary": "У вас актуальная версия ScreenTool {{version}}.",
		"updates.downloadingSummary": "Загрузка ScreenTool {{version}}",
		"unsaved.buttons.save": "Сохранить и закрыть",
		"unsaved.buttons.discard": "Закрыть без сохранения",
		"unsaved.buttons.cancel": "Отмена",
		"unsaved.title": "Есть несохранённые изменения",
		"unsaved.message": "В проекте есть несохранённые изменения.",
		"unsaved.detail": "Сохранить проект перед закрытием?",
		"files.importMediaOrProject": "Импорт медиа или проекта ScreenTool",
		"files.selectVideo": "Выберите видеофайл",
		"files.mediaOrProjects": "Медиа или проекты ScreenTool",
		"files.videoFiles": "Видеофайлы",
		"files.screentoolProjects": "Проекты ScreenTool",
		"files.allFiles": "Все файлы",
		"files.selectAudio": "Выберите аудиофайл",
		"files.audioFiles": "Аудиофайлы",
		"files.selectWhisperExecutable": "Выберите файл Whisper",
		"files.executables": "Исполняемые файлы",
		"files.selectWhisperModel": "Выберите модель Whisper",
		"files.whisperModels": "Модели Whisper",
		"files.failedOpenPicker": "Не удалось открыть выбор файла",
		"files.failedOpenAudioPicker": "Не удалось открыть выбор аудиофайла",
		"export.gifImage": "GIF-изображение",
		"export.mp4Video": "Видео MP4",
		"export.saveGif": "Сохранить GIF",
		"export.saveVideo": "Сохранить видео",
		"export.canceled": "Экспорт отменён",
		"export.videoExported": "Видео успешно экспортировано",
		"export.failedSaveVideo": "Не удалось сохранить экспортированное видео",
		"export.tooLarge":
			"Экспорт слишком большой для старого способа сохранения в памяти. Повторите с включённым сохранением через временный файл.",
		"export.captionSidecarFailed": "Не удалось сохранить субтитры рядом с видео.",
		"project.nameAlreadyUsed": "Другое имя проекта уже занято.",
		"project.unableToVerifyName": "Не удалось проверить проект для выбранного имени.",
		"project.revealFallback": "Не удалось показать файл, поэтому открыта папка.",
		"project.openRecordingsFolderFailed": "Не удалось открыть папку с записями.",
		"project.chooseRecordingsFolder": "Выберите папку для записей",
		"project.setRecordingsFolderFailed": "Не удалось выбрать папку для записей",
		"project.saved": "Проект сохранён",
		"project.pathNoLongerTrusted":
			"Путь проекта больше не считается доверенным. Используйте «Сохранить как».",
		"project.saveScreenToolProject": "Сохранить проект ScreenTool",
		"project.screentoolProject": "Проект ScreenTool",
		"project.saveCanceled": "Сохранение проекта отменено",
		"project.saveFailed": "Не удалось сохранить файл проекта",
		"project.nameRequired": "Введите название проекта",
		"project.openScreenToolProject": "Открыть проект ScreenTool",
		"project.openCanceled": "Открытие проекта отменено",
		"project.loadFailed": "Не удалось загрузить файл проекта",
		"project.noActiveProject": "Нет активного проекта",
		"project.loadCurrentFailed": "Не удалось загрузить текущий файл проекта",
		"project.openFileFailed": "Не удалось открыть файл проекта",
		"project.openProjectsFolderFailed": "Не удалось открыть папку проектов.",
		"recording.screenPermissionTitle": "Нужно разрешение на запись экрана",
		"recording.screenPermissionMessage":
			"ScreenTool нужен доступ к записи экрана, чтобы захватывать изображение.",
		"recording.screenPermissionDetail":
			"Откройте Системные настройки > Конфиденциальность и безопасность > Запись экрана, включите ScreenTool и попробуйте снова.",
		"recording.microphonePermissionTitle": "Нужно разрешение на микрофон",
		"recording.microphonePermissionMessage":
			"ScreenTool нужен доступ к микрофону для записи звука.",
		"recording.microphonePermissionDetail":
			"Откройте Системные настройки > Конфиденциальность и безопасность > Микрофон, включите ScreenTool и попробуйте снова.",
		"recording.openSystemSettings": "Открыть настройки",
		"recording.cancel": "Отмена",
		"recording.screenPermissionDenied":
			"Нет разрешения на запись экрана. Разрешите доступ в Системных настройках и перезапустите приложение.",
		"recording.microphonePermissionDenied":
			"Нет разрешения на микрофон. Разрешите доступ в Системных настройках.",
		"recording.nativeStartFailed": "Не удалось начать нативную запись ScreenCaptureKit",
		"recording.windowsUnavailable": "Нативный захват Windows недоступен на этом устройстве.",
		"recording.windowsAlreadyActive": "Нативная запись Windows уже идёт.",
		"recording.selectedWindowUnavailable":
			"Выбранное окно больше недоступно. Выберите окно заново.",
		"recording.windowsStartFailed": "Не удалось начать нативный захват Windows",
		"recording.nativeOnlyMac": "Нативная запись экрана доступна только на macOS.",
		"recording.nativeAlreadyActive": "Нативная запись экрана уже идёт.",
		"recording.windowsStopFailed": "Не удалось остановить нативный захват Windows",
		"recording.nativeNotActive": "Нативная запись экрана не активна.",
		"recording.macStopFailed": "Не удалось остановить запись ScreenCaptureKit",
		"recording.macRecoveryOnly": "Восстановление нативной записи доступно только на macOS.",
		"recording.macRecoverableOutputMissing":
			"Не найден файл нативной записи macOS, который можно восстановить.",
		"recording.windowsNotActive": "Нативная запись Windows не активна.",
		"recording.windowsPauseFailed": "Не удалось поставить нативный захват Windows на паузу",
		"recording.nativePauseFailed": "Не удалось поставить нативную запись на паузу",
		"recording.windowsResumeFailed": "Не удалось возобновить нативный захват Windows",
		"recording.nativeResumeFailed": "Не удалось возобновить нативную запись",
		"recording.windowsMuxPendingMissing": "Нет готового нативного видео Windows для склейки",
		"recording.windowsMuxFailed": "Не удалось склеить нативную запись Windows",
		"recording.ffmpegAlreadyActive": "Запись FFmpeg уже идёт.",
		"recording.ffmpegStartFailed": "Не удалось начать запись FFmpeg",
		"recording.ffmpegNotActive": "Запись FFmpeg не активна.",
		"recording.ffmpegStopFailed": "Не удалось остановить запись FFmpeg",
		"recording.storeVideoFailed": "Не удалось сохранить видео",
		"recording.noRecordedVideo": "Записанное видео не найдено",
		"recording.noUsableRecordedVideo": "Не найдено пригодное записанное видео",
		"recording.getVideoPathFailed": "Не удалось получить путь к видео",
		"recording.cursorTelemetryLoadFailed": "Не удалось загрузить данные курсора",
		"recording.cursorTelemetryNoVideoPath": "Нет пути к видео для данных курсора",
		"recording.cursorTelemetrySaveFailed": "Не удалось сохранить данные курсора",
		"captions.generated": "Создано субтитров: {{count}}.",
		"captions.generatedFromSource": "Создано субтитров: {{count}} из источника {{source}}.",
		"captions.generateFailed": "Не удалось создать автосубтитры",
		"system.screen": "Экран",
		"system.screenNumber": "Экран {{number}}",
		"system.screenNumberPrimary": "Экран {{number}} (основной)",
		"system.entireScreen": "Весь экран",
	},
};

function normalizeLocale(value: unknown): ElectronLocale {
	if (typeof value !== "string") {
		return "en";
	}

	return value.toLowerCase().startsWith("ru") ? "ru" : "en";
}

export function getElectronLocale(): ElectronLocale {
	try {
		if (!app || typeof app.getPath !== "function") {
			return "en";
		}

		const settingsFile = path.join(app.getPath("userData"), "app-settings.json");
		const content = readFileSync(settingsFile, "utf-8");
		const settings = JSON.parse(content.replace(/^\uFEFF/, "")) as Record<string, unknown>;
		return normalizeLocale(settings[LOCALE_STORAGE_KEY]);
	} catch {
		try {
			return normalizeLocale(app.getLocale());
		} catch {
			return "en";
		}
	}
}

function interpolate(template: string, vars?: Record<string, string | number>) {
	if (!vars) {
		return template;
	}

	return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
		Object.keys(vars).includes(key) ? String(vars[key]) : match,
	);
}

export function tElectron(key: string, fallback: string, vars?: Record<string, string | number>) {
	const locale = getElectronLocale();
	const template = dictionaries[locale][key] ?? dictionaries.en[key] ?? fallback;
	return interpolate(template, vars);
}
