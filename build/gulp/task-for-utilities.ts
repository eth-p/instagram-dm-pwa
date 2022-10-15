// Gulp.
import type { SharedTypescriptStream } from "gulp-typescript-shared";
import rollup from "gulp-rollup-rerolled";
import reexports from "gulp-generate-reexports";

import { dest } from "gulp";
import rename from "gulp-rename";
import babel from "gulp-babel";
import prettier from "gulp-prettier";
import plumber from "gulp-plumber";
import {prependText} from "gulp-append-prepend";

// Rollup.
import rollupLib from "rollup";
import RollupInsert from "rollup-plugin-insert";

// Babel.
import BabelModuleRewrite from "babel-transform-rewrite-modules";

// Utils.
import { SOURCES, TARGETS, ROOT } from "../paths";
import { convertModuleNameToIdentifier, getExternalModules, stripRoot } from "./utils";
import { BABEL_PLUGIN_EXPORT_LIB_MODULES, BABEL_PLUGIN_REMOVE_DOC_COMMENTS } from "./common";

// Config.
const BABEL_CONFIG: Parameters<typeof babel>[0] = {
	plugins: [
		[BabelModuleRewrite, { rewrite: (name) => name.replace(/^IG_/, "") }],
		BABEL_PLUGIN_EXPORT_LIB_MODULES,
		BABEL_PLUGIN_REMOVE_DOC_COMMENTS,
	] as any,
};

const REEXPORTS_CONFIG: Parameters<typeof reexports>[0] = {
	patterns: ["**/*.js"],
	outputFile: `${stripRoot(SOURCES.UTILITIES)}/$reexport.js`,
	mapModulePathToIdentifier: convertModuleNameToIdentifier,
};

const ROLLUP_CONFIG: Parameters<typeof rollup>[1] = {
	input: `./${REEXPORTS_CONFIG.outputFile}`,
	external: ["react"],
	plugins: [
		RollupInsert.transform((_magicString, code, id) => {
			return `// --------------------> ${id} <-------------------- //\n${code}`;
		}),
	],
	output: {
		file: "$utilities.js",
		format: "es",
	},
};

export default function createUtilitiesTask(tsc: () => SharedTypescriptStream): Function {
	return () => {
		const src = tsc();
		const rollupConfig = {
			...ROLLUP_CONFIG,
			rerolled: {
				...(ROLLUP_CONFIG.rerolled ?? {}),
				external: getExternalModules.bind(null, src.tsProject.config.compilerOptions),
			},
		};

		return src
			.pipe(plumber({ errorHandler: error => console.error(error) }))
			.pipe(reexports(REEXPORTS_CONFIG))
			.pipe(rollup(rollupLib, rollupConfig))
			.pipe(prettier())
			.pipe(prependText("const $lib = {};\n\n"))
			.pipe(rename({ dirname: stripRoot(SOURCES.UTILITIES), basename: "utilities" }))
			.pipe(babel(BABEL_CONFIG))
			.pipe(dest(TARGETS.INTERMEDIATE, { cwd: ROOT }));
	};
}
