import { basename, extname, join, relative, sep } from "path";
import { readdirSync } from "fs";
import { readdir } from "fs/promises";
import * as ts from "typescript";

import { ROOT, SOURCES } from "../paths";

/**
 * Strips the root path from a file path.
 * @param file The file path.
 */
export function stripRoot(file: string): string {
	const rel = relative(ROOT, file);
	if (rel.startsWith(".." + sep)) {
		return file;
	}

	return rel;
}

/**
 * Checks if the given file is a TypeScript file.
 * @param file The file path.
 */
export function isTypescriptFile(file: string): boolean {
	const ext = extname(file).toLowerCase();
	return ext === ".ts" || ext === ".tsx";
}

/**
 * Gets all the source files in a directory.
 * @param path The directory path.
 */
export function getSourceFiles(path: string): string[] {
	return readdirSync(path)
		.map(f => join(path, f))
		.filter(isTypescriptFile);
}

/**
 * Gets the list of declared external modules.
 *
 * These are the modules natively included in the Instagram website.
 * Definitions can be found under "src/instagram/*.d.ts".
 *
 * @param config The tsconfig JSON.
 * @return {string[]}
 **/
export async function getExternalModules(config: ts.CompilerOptions): Promise<string[]> {
	const declarations = (await readdir(SOURCES.TYPES))
		.map(x => stripRoot(`${SOURCES.TYPES}/${x}`));

	const program = ts.createProgram(declarations, config);
	const externals: string[] = [];

	for (const declaration of declarations) {
		const source = program.getSourceFile(declaration);
		ts.forEachChild(source, node => {
			if (ts.isModuleDeclaration(node)) {
				externals.push(node.name.text);
			}
		});
	}

	return externals;
}

/**
 * Checks if a module is referring to a local module.
 * @param name The module name.
 */
export function isLocalModule(name: string) {
	return name.startsWith("./") || name.startsWith("../");
}

/**
 * Converts a module name to a string that can safely be used as a JavaScript identifier.
 * @param name The module name.
 */
export function convertModuleNameToIdentifier(name: string): string {
	return basename(name, extname(name))
		.replace(/[^a-z0-9]/ig, "_")
		.replace(/_{2,}/g, "_")
		.replace(/^[0-9]*/g, "_")
		.replace(/^_*/g, "")
		.replace(/_*$/g, "");
}

/**
 * Replaces template variables in a string.
 *
 * @param string The string with variables to replace.
 * @param replacements The replacement strings.
 * @returns {string}
 */
export function template(string, replacements) {
	const TEMPLATE_VAR = /\${[ \t]*([^}]+?)[ \t]*}/g;
	return string.replaceAll(TEMPLATE_VAR, (_substring, varname) => {
		if (varname in replacements) {
			return replacements[varname];
		} else {
			return `<unknown: \${${varname}}>`;
		}
	});
}
