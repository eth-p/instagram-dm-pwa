import type { Program } from "babel-types";
import type { NodePath } from "babel-traverse";

import { declare } from "@babel/helper-plugin-utils";
import { basename, extname } from "path";

import removeEsnextImports from "./remove-esnext-imports";
import transformFeatureImports from "./transform-feature-imports";
import transformFeatureDynamicImports from "./transform-feature-dynamic-imports";

export interface Options {
	rename?: (moduleName: string) => string;
	isAffected?: (moduleName: string) => boolean;
	insertCommentAtStart?: string | null;
	insertCommentAtEnd?: string | null;
	defineFunction?: string | null;
	dynamicImportFunction?: string | null;
}

export default declare<{}>((api, options: Options) => {
	api.assertVersion(7);

	let {
		isAffected,
		rename,
		insertCommentAtStart,
		insertCommentAtEnd,
		defineFunction,
		dynamicImportFunction,
	} = options;
	if (isAffected == null) {
		isAffected = (_moduleName: string) => true;
	}

	return {
		name: "transform-modules-feature",

		pre() {
			this.file.set("@babel/plugin-transform-modules-*", "amd");
		},

		visitor: {
			Program: {
				exit(path: NodePath<Program>) {
					const feature = basename(this.file.opts.sourceFileName, extname(this.file.opts.sourceFileName));
					const imports = removeEsnextImports(path, isAffected);

					if (rename) {
						for (const module of imports.values()) {
							module.module = rename(module.module);
						}
					}

					transformFeatureImports(path, feature, Array.from(imports.values()), {
						insertCommentAtStart,
						insertCommentAtEnd,
						defineFunction: defineFunction ?? "feature",
					});

					if (dynamicImportFunction != null) {
						transformFeatureDynamicImports(path, {
							importFunction: dynamicImportFunction,
						});
					}
				},
			},
		},
	};
});
