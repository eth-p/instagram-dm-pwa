// Gulp.
import type { SharedTypescriptStream } from "gulp-typescript-shared";

import {dest} from "gulp";
import babel from "gulp-babel"
import prettier from "gulp-prettier";

// Babel.
import BabelModuleRewrite from "babel-transform-rewrite-modules";

// Utils.
import { TARGETS } from "../paths";
import { BABEL_PLUGIN_IMPORT_LIB_MODULES, BABEL_PLUGIN_REMOVE_DOC_COMMENTS } from "./common";
import { prependText } from "gulp-append-prepend";
import plumber from "gulp-plumber";

// Config.
const BABEL_CONFIG: Parameters<typeof babel>[0] = {
	plugins: [
		[BabelModuleRewrite, { rewrite: (name) => name.replace(/^IG_/, "") }],
		BABEL_PLUGIN_IMPORT_LIB_MODULES,
		BABEL_PLUGIN_REMOVE_DOC_COMMENTS
	] as any,
};

export default function createBootstrapTask(tsc: () => SharedTypescriptStream): Function {
	return () => {
		return tsc()
			.pipe(plumber({ errorHandler: error => console.error(error) }))
			.pipe(prettier())
			.pipe(babel(BABEL_CONFIG))
			.pipe(prependText("\n// --------------------> src/bootstrap.js <-------------------- //\n"))
			.pipe(dest(TARGETS.INTERMEDIATE));
	}
}
