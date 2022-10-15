import type typescript from "gulp-typescript";
import { CompileStream } from "gulp-typescript";
import plumber from "gulp-plumber";

import { warn } from "fancy-log";
import { Transform } from "stream";
import { isMatch } from "micromatch";
import { inspect } from "util";
import VinylFile from "vinyl";

const TYPE_TAG = Symbol();
export type SharedTypescriptStream = NodeJS.ReadWriteStream & {
	tsProject: typescript.Project;
	__tag: typeof TYPE_TAG;
};

interface CompilerObject {
	emitted: Map<string, VinylFile>;
	state: "emitting" | "finished";
	instance: CompileStream | null;
}

/**
 * A Gulp plugin that creates a shared TypeScript compiler.
 *
 * This will compile all the input files in a single instance and emit them
 * for all tasks bound to it.
 *
 * @param project The TypeScript project.
 */
export default function sharedTypescriptCompiler(project: typescript.Project) {
	const cache = new Map<string, VinylFile>;
	const compiler: CompilerObject = {
		emitted: new Map(),
		state: "finished",
		instance: null,
	};

	function requestCompilerFor(callback: (status: "error"|"end", result: Map<string, VinylFile>) => void): CompilerObject {
		if (compiler.state === "finished") {
			compiler.emitted = new Map();
			compiler.state = "emitting";
			compiler.instance = project.src()
				.pipe(plumber({ errorHandler: (error) => {} }))
				.pipe(project());

			compiler.instance.setMaxListeners(1000);

			// Add files to the emitted cache.
			compiler.instance.on("data", (chunk: VinylFile) => {
				compiler.emitted.set(chunk.relative, chunk);
			});

			// Update the state when the compiler finishes emitting.
			compiler.instance.on("end", () => {
				compiler.state = "finished";
			});
		}

		// Attach the compiler to the output stream.
		const current = compiler;

		current.instance.once("error", () => {
			callback("error", current.emitted);
			callback = () => {};
		});

		current.instance.once("end", () => {
			callback("end", current.emitted);
		});

		return { ...compiler };
	}

	// Return a function to build a Gulp source stream.
	function compiledSrc(patterns: string[]): SharedTypescriptStream {
		const matches = (file: string) => isMatch(file, patterns);
		const output = new Transform({ objectMode: true }) as Transform & SharedTypescriptStream;

		const compiler = requestCompilerFor((status, files) => {
			if (status === "error" && project.options.noEmitOnError) {
				output.emit("finish");
				output.emit("close");
				return;
			}

			let emittedAny = false;
			for (const [path, file] of files.entries()) {
				if (!matches(path)) continue;

				emittedAny = true;
				output.push(file);
			}

			if (!emittedAny) {
				warn(`Patterns ${inspect(patterns)} did not match any files.`);
			}

			output.emit("end");
		});

		output.tsProject = project;
		return output as unknown as SharedTypescriptStream;
	}

	compiledSrc.tsProject = project;
	return compiledSrc;
}
