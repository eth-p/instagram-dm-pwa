import type { Program } from "babel-types";
import type { NodePath } from "babel-traverse";

import { declare } from "@babel/helper-plugin-utils";
import { basename, extname } from "path";

import removeEsnextImports from "./remove-esnext-imports";
import transformImports from "./transform-imports";
import { ConvertToIdentifierFunction } from "./util";
import transformExports from "./transform-exports";

export interface Options {
	convertToIdentifier?: ConvertToIdentifierFunction;
	isAffected?: (moduleName: string) => boolean;
	importsVariable?: string | null;
	exportsVariable?: string | null;
}

function defaultConvertToIdentifier(moduleName: string, moduleProperty: string): string {
	const sanitizedName = moduleName.replace(/[^a-z]/g, "_");
	return `${sanitizedName}.${moduleProperty}`;
}

export default declare<{}>((api, options: Options) => {
	api.assertVersion(7);

	let { isAffected, convertToIdentifier, importsVariable, exportsVariable } = options;
	if (isAffected == null) isAffected = (_moduleName: string) => true;
	if (convertToIdentifier == null) convertToIdentifier = defaultConvertToIdentifier;

	return {
		name: "transform-modules-object-properties",
		visitor: {
			Program: {
				exit(path: NodePath<Program>) {
					const script = basename(this.file.opts.sourceFileName, extname(this.file.opts.sourceFileName));

					// Transform the imports.
					if (importsVariable != null) {
						const imports = removeEsnextImports(path, isAffected);

						transformImports(
							path,
							Array.from(imports.values()),
							importsVariable,
							convertToIdentifier,
						);
					}

					// Transform the imports.
					if (exportsVariable != null) {
						transformExports(
							path,
							script,
							exportsVariable,
							convertToIdentifier,
						);
					}
				},
			},
		},
	};
});
