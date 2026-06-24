import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const localesDir = path.join(root, "src", "i18n", "locales");
const configPath = path.join(root, "src", "i18n", "config.ts");

function parseConfigArray(source, name) {
	const match = source.match(
		new RegExp(`export\\s+const\\s+${name}\\s*=\\s*\\[(.*?)\\]\\s+as\\s+const`, "s"),
	);
	if (!match) {
		throw new Error(`i18n-check: could not read ${name} from src/i18n/config.ts`);
	}

	return [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]);
}

const configSource = fs.readFileSync(configPath, "utf8");
const supportedLocales = parseConfigArray(configSource, "SUPPORTED_LOCALES");
const namespaces = parseConfigArray(configSource, "I18N_NAMESPACES");

const locales = fs
	.readdirSync(localesDir)
	.filter((entry) => {
		const fullPath = path.join(localesDir, entry);
		return fs.statSync(fullPath).isDirectory();
	})
	.sort((left, right) => left.localeCompare(right));

if (!locales.includes("en")) {
	console.error('i18n-check: expected base locale directory "en"');
	process.exit(1);
}

let hasErrors = false;

for (const locale of supportedLocales) {
	if (!locales.includes(locale)) {
		console.error(`i18n-check: missing locale directory ${locale}`);
		hasErrors = true;
	}
}

for (const locale of locales) {
	if (!supportedLocales.includes(locale)) {
		console.error(`i18n-check: locale directory ${locale} is not listed in SUPPORTED_LOCALES`);
		hasErrors = true;
	}
}

function loadJson(filePath) {
	try {
		return JSON.parse(fs.readFileSync(filePath, "utf8"));
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`i18n-check: failed to load ${path.relative(root, filePath)}: ${message}`);
	}
}

function collectKeyPaths(obj, prefix = "") {
	if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
		return prefix ? [prefix] : [];
	}

	const keys = Object.keys(obj);
	if (keys.length === 0) {
		return prefix ? [prefix] : [];
	}

	const paths = [];
	for (const key of keys) {
		const nextPrefix = prefix ? `${prefix}.${key}` : key;
		const value = obj[key];
		if (value && typeof value === "object" && !Array.isArray(value)) {
			paths.push(...collectKeyPaths(value, nextPrefix));
		} else {
			paths.push(nextPrefix);
		}
	}
	return paths;
}

function readSourceFiles(dir) {
	const files = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (["node_modules", "dist", "dist-electron", ".git"].includes(entry.name)) {
				continue;
			}
			files.push(...readSourceFiles(fullPath));
			continue;
		}

		if (/\.(tsx?|jsx?)$/.test(entry.name)) {
			files.push(fullPath);
		}
	}
	return files;
}

function parseI18nKey(key) {
	const [first, ...rest] = key.split(".");
	if (namespaces.includes(first) && rest.length > 0) {
		return { namespace: first, keyPath: rest.join(".") };
	}
	return { namespace: "common", keyPath: key };
}

function getValueAtPath(obj, keyPath) {
	return keyPath.split(".").reduce((current, key) => {
		if (!current || typeof current !== "object") {
			return undefined;
		}
		return current[key];
	}, obj);
}

function collectUsedKeys() {
	const sourceDir = path.join(root, "src");
	const used = [];

	for (const filePath of readSourceFiles(sourceDir)) {
		const source = fs.readFileSync(filePath, "utf8");
		const scopedTranslators = new Map();

		for (const match of source.matchAll(
			/const\s+(\w+)\s*=\s*useScopedT\(\s*["'](\w+)["']\s*\)/g,
		)) {
			scopedTranslators.set(match[1], match[2]);
		}

		for (const [translatorName, namespace] of scopedTranslators) {
			const keyPattern = new RegExp(`\\b${translatorName}\\(\\s*["']([^"']+)["']`, "g");
			for (const match of source.matchAll(keyPattern)) {
				used.push({
					key: `${namespace}.${match[1]}`,
					filePath,
				});
			}
		}

		if (!scopedTranslators.has("t")) {
			for (const match of source.matchAll(/\bt\(\s*["']([^"']+)["']/g)) {
				used.push({
					key: match[1],
					filePath,
				});
			}
		}
	}

	return used;
}

const baseLocaleDir = path.join(localesDir, "en");
const namespaceFiles = fs
	.readdirSync(baseLocaleDir)
	.filter((file) => file.endsWith(".json"))
	.sort((left, right) => left.localeCompare(right));

for (const namespaceFile of namespaceFiles) {
	const baseData = loadJson(path.join(baseLocaleDir, namespaceFile));
	const baseKeys = new Set(collectKeyPaths(baseData));

	for (const locale of locales) {
		if (locale === "en") continue;

		const localeFile = path.join(localesDir, locale, namespaceFile);
		if (!fs.existsSync(localeFile)) {
			console.error(`i18n-check: missing namespace file ${locale}/${namespaceFile}`);
			hasErrors = true;
			continue;
		}

		const localeData = loadJson(localeFile);
		const localeKeys = new Set(collectKeyPaths(localeData));

		for (const key of baseKeys) {
			if (!localeKeys.has(key)) {
				console.error(`i18n-check: missing key ${locale}/${namespaceFile}:${key}`);
				hasErrors = true;
			}
		}

		for (const key of localeKeys) {
			if (!baseKeys.has(key)) {
				console.error(`i18n-check: extra key ${locale}/${namespaceFile}:${key}`);
				hasErrors = true;
			}
		}
	}
}

const baseDataByNamespace = Object.fromEntries(
	namespaceFiles.map((namespaceFile) => [
		namespaceFile.replace(/\.json$/, ""),
		loadJson(path.join(baseLocaleDir, namespaceFile)),
	]),
);

const seenUsedKeys = new Set();
for (const usedKey of collectUsedKeys()) {
	if (seenUsedKeys.has(usedKey.key)) {
		continue;
	}
	seenUsedKeys.add(usedKey.key);

	const { namespace, keyPath } = parseI18nKey(usedKey.key);
	if (!baseDataByNamespace[namespace]) {
		console.error(
			`i18n-check: used key ${usedKey.key} references missing namespace ${namespace} in ${path.relative(root, usedKey.filePath)}`,
		);
		hasErrors = true;
		continue;
	}

	if (getValueAtPath(baseDataByNamespace[namespace], keyPath) === undefined) {
		console.error(
			`i18n-check: used key ${usedKey.key} is missing from en/${namespace}.json in ${path.relative(root, usedKey.filePath)}`,
		);
		hasErrors = true;
	}
}

if (hasErrors) {
	process.exit(1);
}

console.log("i18n-check: locale files and used keys are consistent");
