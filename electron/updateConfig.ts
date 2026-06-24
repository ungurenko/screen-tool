export const DEFAULT_UPDATE_FEED_URL =
	"https://github.com/ungurenko/screen-tool/releases/latest/download";

export interface AutoUpdateEnvironment {
	[key: string]: string | undefined;
	SCREENTOOL_DISABLE_AUTO_UPDATES?: string;
	SCREENTOOL_UPDATE_FEED_URL?: string;
}

export function isAutoUpdateDisabledByEnv(env: AutoUpdateEnvironment = process.env) {
	return env.SCREENTOOL_DISABLE_AUTO_UPDATES === "1";
}

export function resolveUpdateFeedUrl(env: AutoUpdateEnvironment = process.env) {
	const override = env.SCREENTOOL_UPDATE_FEED_URL?.trim();
	return override || DEFAULT_UPDATE_FEED_URL;
}
