// Gulp.
import type { SharedTypescriptStream } from "gulp-typescript-shared";

import { dest } from "gulp";
import babel from "gulp-babel";
import plumber from "gulp-plumber";
import prettier from "gulp-prettier";

// Babel.
import BabelFeatureModules from "babel-transform-modules-feature";
import BabelModuleRewrite from "babel-transform-rewrite-modules";

// Utils.
import { TARGETS } from "../paths";
import { isLocalModule } from "./utils";
import { BABEL_PLUGIN_IMPORT_LIB_MODULES, BABEL_PLUGIN_REMOVE_DOC_COMMENTS } from "./common";

// Config.
const BABEL_CONFIG: Parameters<typeof babel>[0] = {
	plugins: [
		[BabelModuleRewrite, { rewrite: (name: string) => name.replace(/^IG_/, "") }],
		BABEL_PLUGIN_IMPORT_LIB_MODULES,
		[BabelFeatureModules, {
			isAffected: n => !isLocalModule(n),
			dynamicImportFunction: "$lib.module.require",
		}],
		BABEL_PLUGIN_REMOVE_DOC_COMMENTS,
	] as any,
};

export default function createFeatureTask(tsc: () => SharedTypescriptStream): Function {
	return () => {
		return tsc()
			.pipe(plumber({ errorHandler: error => console.error(error) }))
			.pipe(babel(BABEL_CONFIG))
			.pipe(prettier())
			.pipe(dest(TARGETS.INTERMEDIATE));
	};
}
