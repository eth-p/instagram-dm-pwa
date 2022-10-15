import {dirname, join} from "path";

export const ROOT = dirname(__dirname);
export const SRC = join(ROOT, "src");

export const CONFIG = {
	PROJECT: join(ROOT, "package.json"),
	TYPESCRIPT: join(ROOT, "tsconfig.json"),
}

export const SOURCES = {
	UTILITIES: join(SRC, "util"),
	FEATURES: join(SRC, "feature"),
	TYPES: join(SRC, "instagram"),
	BOOTSTRAP: join(SRC, "bootstrap.ts"),
	MANIFEST: join(SRC, "manifest.txt"),
	PACKAGE_JSON: join(ROOT, "package.json"),
}

export const TARGETS = {
	ARTIFACT: join(ROOT, "dist"),
	INTERMEDIATE: join(ROOT, "_target"),
}
