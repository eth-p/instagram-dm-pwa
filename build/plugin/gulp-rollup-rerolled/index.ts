import type * as rollupLib from "rollup";
import type { ExternalOption, InputPluginOption, OutputChunk, Plugin, RollupOptions } from "rollup";

import { normalize, join, dirname } from "path/posix";
import { Transform, TransformCallback } from "stream";
import VinylFile from "vinyl";

const TYPE_TAG = Symbol();
export type RollupStream = NodeJS.ReadWriteStream & { __tag: typeof TYPE_TAG };

/**
 * Injects a plugin into the Rollup plugin option.
 *
 * @param plugins The original plugin.
 * @param inject The plugin(s) to inject.
 */
function injectPlugin(plugins: InputPluginOption, inject: Plugin[]): InputPluginOption {
	// If it's a promise, inject the promise.
	if (typeof (plugins as Promise<any>).then === "function") {
		return async () => {
			return injectPlugin(await plugins, inject);
		};
	}

	// If it's an array, prepend.
	if (plugins instanceof Array) {
		return [...inject, ...plugins];
	}

	// If it's falsy, replace.
	if (!plugins) {
		return inject;
	}

	// It's probably a plugin, turn it into an array.
	return [...inject, plugins];
}

/**
 * A loader and resolver plugin for Rollup that fetches files from a Gulp stream.
 *
 * @param inputs The input files.
 */
function GulpLoader(inputs: Map<string, VinylFile>): Plugin {
	function tryFile(path: string): VinylFile | null {
		return inputs.get(path) ??
			inputs.get(`${path}.js`);
	}

	// noinspection JSUnusedGlobalSymbols
	return {
		name: "gulp-rollup-rerolled",

		async load(path: string) {
			const file = tryFile(path);
			if (file == null) {
				this.error(`gulp-rollup-rerolled: module "${path}" was not provided as an input.`);
				return;
			}

			return {
				code: file.contents.toString("utf-8"),
				map: file.sourcemap,
			};
		},

		async resolveId(id: string, importer: string | undefined) {
			const path = normalize(join(dirname(importer ?? "."), id));
			const file = tryFile(path);
			if (file == null) {
				this.error(`gulp-rollup-rerolled: Module "${id}" was not provided as an input.`);
				return;
			}

			return file.relative;
		},
	};
}

export type Options = RollupOptions & {
	rerolled?: {

		/**
		 * Generated external module list.
		 */
		external?: () => Promise<ExternalOption>;

		/**
		 * Output file cwd.
		 */
		cwd?: string;

	}
}

/**
 * A Gulp plugin for bundling files with the rollup bundler.
 * This uses the in-memory file stream from Gulp for its source.
 *
 * @param rollup The rollup instance.
 * @param options The rollup options.
 */
export default function gulpRollupRerolled(rollup: typeof rollupLib, options: Options): RollupStream {
	const inputs = new Map<string, VinylFile>();
	const rerolled: Options["rerolled"] = options.rerolled ?? {};

	const opts: RollupOptions = {
		...options,
		plugins: injectPlugin(options.plugins ?? [], [
			GulpLoader(inputs)
		]),
	};

	delete (opts as Options).rerolled;

	// Return a new transformer that runs rollup on all the files it receives.
	return new Transform({
		objectMode: true,

		transform(chunk: VinylFile, encoding: BufferEncoding, callback: TransformCallback) {
			callback();
			inputs.set(chunk.relative, chunk);
		},

		async flush(callback: TransformCallback) {
			const instanceOpts = {...opts};

			// If rerolled.external is provided, regenerate the list of external modules.
			if (rerolled.external != null) {
				const externals = await rerolled.external();
				if (instanceOpts.external instanceof Array && externals instanceof Array) {
					instanceOpts.external.push(...externals);
				} else {
					instanceOpts.external = externals;
				}
			}

			// Pipe the files through rollup.
			rollup.rollup(instanceOpts)
				.then(build => build.generate({}))
				.then(result => result.output)
				.then((res) => {
					const cwd = rerolled.cwd ?? process.cwd();
					for (const chunk of res) {
						const path = join(cwd, chunk.fileName);
						const contents = Buffer.from(("code" in chunk) ? chunk.code : chunk.source);

						this.push(new VinylFile({
							sourcemap: (chunk as any).map,
							contents,
							path,
							cwd,
						}));
					}

					callback(null);
				})
				.catch(error => {
					this.emit("error", error);
				});
		},
	}) as unknown as RollupStream;
}
