// Gulp.
import gulpTs from "gulp-typescript";
import order from "gulp-order";
import concat from "gulp-concat";
import { dest, watch } from "gulp";
import ts from "typescript";
import sharedTypescriptCompiler from "gulp-typescript-shared";

// Libraries.
import { basename, extname } from "path/posix";
import merge from "merge-stream";

// Utilities.
import { CONFIG, ROOT, SOURCES, TARGETS } from "../paths";
import { getSourceFiles, stripRoot } from "./utils";

// Tasks.
import { gulp as installer } from "./watcher-install-userscripts";
import createFeatureTask from "./task-for-feature";
import createUtilitiesTask from "./task-for-utilities";
import createBootstrapTask from "./task-for-bootstrap";
import createManifestTask from "./task-for-manifest";
import { Transform } from "stream";

// Create the shared TypeScript compiler.
const typescript = sharedTypescriptCompiler(
	gulpTs.createProject(CONFIG.TYPESCRIPT, {
		typescript: ts,
		rootDir: ROOT,
		noEmit: false,
		declaration: false,
	}),
);

// Add manifest task.
const manifest = createManifestTask();
exports[`manifest`] = manifest;

// Add utilities library tasks.
const utilities = createUtilitiesTask(() => typescript([`${stripRoot(SOURCES.UTILITIES)}/*.js`]));
exports[`utilities`] = utilities;

// Add bootstrap entry point task.
const bootstrap = createBootstrapTask(() => typescript([stripRoot(SOURCES.BOOTSTRAP.replace(".ts", ".js"))]));
exports[`bootstrap`] = bootstrap;

// Add feature tasks.
const features = getSourceFiles(SOURCES.FEATURES).map(f => {
	const file = stripRoot(f).replace(/\.tsx?$/, ".js");
	const name = basename(f, extname(f));
	const taskName = `feature:${name}`;
	const task = createFeatureTask(() => typescript([file]));

	(task as any).displayName = taskName;
	exports[taskName] = task;

	return { file, name, taskName, task };
});

// Add bundle task.
let install = () => new Transform({ objectMode: true, transform: (c, e, cb) => cb(null, e) });
const bundle = async function bundle() {
	const info = require(SOURCES.PACKAGE_JSON);
	const outputFile = `${info.name}.user.js`;

	const streams = await Promise.all([
		utilities(),
		bootstrap(),
		manifest(),
		...features.map(f => f.task()),
	]);

	const merged = merge(...streams)
		.pipe(order([
			`${stripRoot(SOURCES.MANIFEST)}`,
			`${stripRoot(SOURCES.UTILITIES)}/**/*.js`,
			`${stripRoot(SOURCES.BOOTSTRAP).replace(".ts", ".js")}`,
			`${stripRoot(SOURCES.FEATURES)}/**/*.js`,
		]))
		.pipe(concat(outputFile))
		.pipe(dest(TARGETS.ARTIFACT))
		.pipe(install());

	return new Promise<void>((resolve, reject) => {
		merged.on('error', reject);
		merged.on('finish', () => resolve());
	});
};

exports[`bundle`] = bundle;
exports[`default`] = bundle;

// Add watch task.
exports[`watch`] = async () => {
	install = installer(null, true);

	const watchPatterns = [
		SOURCES.MANIFEST,
		SOURCES.PACKAGE_JSON,
		SOURCES.BOOTSTRAP,
		SOURCES.UTILITIES + "/**/*.ts",
		SOURCES.UTILITIES + "/**/*.tsx",
		SOURCES.FEATURES + "/**/*.ts",
		SOURCES.FEATURES + "/**/*.tsx",
		SOURCES.TYPES + "/**/*.d.ts",
	];

	await bundle();
	watch(watchPatterns.map(stripRoot), bundle);
};
