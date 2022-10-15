import { basename, dirname, extname, relative } from "path";
import { Transform } from "stream";
import { isMatch } from "micromatch";
import VinylFile from "vinyl";

/**
 * A Gulp plugin that generates a file that re-exports the contents from another file.
 *
 * @param opts.patterns The filter patterns.
 * @param opts.outputFile The name of the generated file.
 * @param opts.cwd The CWD of the generated file.
 * @param opts.mapModulePathToIdentifier A function that maps a module file path to an export identifier.
 */
export default function generateReexports(opts: {
	patterns: string[],
	outputFile: string,
	cwd?: string
	mapModulePathToIdentifier?: (path: string) => string;
}) {
	const { patterns, outputFile } = opts;
	const matches = (file: string) => isMatch(file, patterns);
	const files = new Set<VinylFile>;
	const cwd = opts?.cwd ?? process.cwd();
	const mapModulePathToIdentifier = opts?.mapModulePathToIdentifier ?? ((path) => {
		return basename(path, extname(path)).replace(/[^a-z]/ig, "_");
	});

	return new Transform({
		objectMode: true,

		write: function(chunk: VinylFile, _, cb) {
			this.push(chunk);
			cb();

			// If the path matches, add it.
			if (matches(chunk.relative)) {
				files.add(chunk);
			}
		},

		flush: function(cb) {
			// Generate the reexport index.
			const outputFilePath = `${cwd}/${outputFile}`;
			const outputFileLines = [];
			const collectedFiles = Array.from(files.values());
			files.clear();

			for (const file of collectedFiles) {
				const identifier = mapModulePathToIdentifier(file.path);

				let rel = relative(dirname(outputFile), file.relative);
				if (!rel.startsWith("./") || !rel.startsWith("../")) rel = `./${rel}`;
				rel = `${dirname(rel)}/${basename(rel, extname(rel))}`;

				outputFileLines.push(
					`import * as ${identifier} from "${rel}";`,
					`export { ${identifier} };`,
				);
			}

			// Push the generated file.
			this.push(new VinylFile({
				cwd,
				path: outputFilePath,
				contents: Buffer.from(outputFileLines.join("\n") + "\n", "utf-8"),
			}));

			// Flush to downstream transforms.
			this.emit("end");
		},
	});
}
