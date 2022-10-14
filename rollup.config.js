import typescript from "@rollup/plugin-typescript";
import replace from "@rollup/plugin-replace";
import insert from "rollup-plugin-insert";
import prettier from "rollup-plugin-prettier";
import watchGlobs from "rollup-plugin-watch-globs";
import installUserscripts from "./rollup.plugin.installuserscript";

import {readFileSync, readdirSync} from "fs";
import {readFile} from "fs/promises";
import * as ts from "typescript";

// =====================================================================================================================
// Utils
// =====================================================================================================================

/**
 * Replaces template variables in a string.
 *
 * @param string The string with variables to replace.
 * @param replacements The replacement strings.
 * @returns {string}
 */
function template(string, replacements) {
	const TEMPLATE_VAR = /\${[ \t]*([^}]+?)[ \t]*}/g;
	return string.replaceAll(TEMPLATE_VAR, (_substring, varname) => {
		if (varname in replacements) {
			return replacements[varname];
		} else {
			return `<unknown: \${${varname}}>`;
		}
	})
}

/**
 * Gets the list of declared external modules.
 *
 * These are the modules natively included in the Instagram website.
 * Definitions can be found under "src/ig/*.d.ts".
 *
 * @param config {any} The tsconfig JSON.
 * @return {string[]}
 **/
function getExternalModules(config) {
	const declarations = (readdirSync("./src/ig")).map(x => `./src/ig/${x}`);

	const program = ts.createProgram(declarations, config);
	const externals = [];

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
 * Gets the UserScript header/manifest.
 *
 * @param file {string} The entry point file.
 * @param replacements The replacement strings.
 * @return {Promise<string>}
 **/
async function getUserscriptHeader(file, replacements) {
	const HEADER_START = /^[ \t]*\/\/[ \t]*==UserScript==[ \t]*$/;
	const HEADER_END = /^[ \t]*\/\/[ \t]*==\/UserScript==[ \t]*$/;

	const lines = (await readFile(file, 'utf-8')).split("\n");
	const start = lines.findIndex(l => HEADER_START.test(l));
	const end = lines.findIndex(l => HEADER_END.test(l));
	return template(lines.slice(start, end + 1).join("\n"), replacements);
}

/**
 * Gets the contents of the bootstrap script.
 *
 * @param file {string} The bootstrap script file.
 * @param config The TSConfig.
 * @returns {Promise<string>}
 */
function getBootstrapScript(file, config) {
	return new Promise((resolve, reject) => {
		const program = ts.createProgram([FILE_BOOTSTRAP], {
			...config.config?.compilerOptions,
			noEmit: false,
			noEmitHelpers: true,
			sourceMap: false,
		});
		const script = program.getSourceFile(file);
		program.emit(script, (name, text) => {
			text = text.replace(/^"use strict";\n/, "")
				.trimStart();

			resolve(text);
		})
	});
}

// =====================================================================================================================
// Config
// =====================================================================================================================

const FILE_MAIN = "./src/main.ts";
const FILE_BOOTSTRAP = "./src/bootstrap.ts";

// Parse the tsconfig.json file and set up a program to compile the bootstrap script.
const configFile = "./tsconfig.json";
const configData = readFileSync(configFile, 'utf8');
const config = ts.parseConfigFileTextToJson(configFile, configData);

// Parse the package.json file.
const project = require("./package.json");

// Get the Instagram modules that we're declaring (and using).
const external = [
	...getExternalModules(config),
	...Object.keys(project.devDependencies).filter(dep => dep.startsWith("@types/")).map(dep => dep.replace(/^@types\//, ""))
];

// Replacement variables.
const replacements = {
	"PROJECT.name": project.name,
	"PROJECT.version": project.version,
	"PROJECT.author": project.author,
	"PROJECT.description": project.description,
	"PROJECT.repository": project.repository.url.replace(/^git\+/, "").replace(/\.git$/, ""),
}

// Config.
export default {
	external,
	input: FILE_MAIN,
	output: {
		file: `dist/${project.name}.user.js`,
		format: "amd",

		// Keep the code as readable as possible.
		interop: false,
		indent: false,
		esModule: false,
		strict: false, // <-- this is injected later

		// Inject the userscript metadata and bootstrap wrapper.
		footer: "})",
		banner: async () => {
			const [metadata, wrapper] = await Promise.all([
				getUserscriptHeader(FILE_MAIN, replacements),
				getBootstrapScript(FILE_BOOTSTRAP, config),
			]);

			return `${metadata}\n(${wrapper.trim()})((define) => {\n"use strict";`;
		},
	},

	plugins: [
		(process.env.ROLLUP_WATCH ? installUserscripts() : {}),
		watchGlobs([FILE_BOOTSTRAP]),

		// Insert file names before each block.
		insert.transform((_magicString, code, id) => {
			const filename = id.substring(__dirname.length + 1);
			return `// ----------> ${filename} <---------- //\n${code}`;
		}),

		// Replace variables.
		replace({
			preventAssignment: true,
			values: replacements,
		}),

		// Compile TypeScript with esbuild.
		typescript({
			typescript: ts
		}),

		// Format with prettier.
		prettier({
			parser: "babel"
		}),
	],
}
