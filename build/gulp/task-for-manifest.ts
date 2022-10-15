// Lib.
import { readFile } from "fs/promises";

// Utils.
import { ROOT, SOURCES } from "../paths";
import { Readable } from "stream";
import VinylFile from "vinyl";
import { template } from "./utils";

export default function createManifestTask(): Function {
	return () => {
		return new Readable({
			objectMode: true,
			async read() {

				const [info, manifest] = await Promise.all([
					readFile(SOURCES.PACKAGE_JSON, "utf-8").then(JSON.parse),
					readFile(SOURCES.MANIFEST, "utf-8"),
				]);

				const replacements = {
					"PROJECT.name": info.name,
					"PROJECT.version": info.version,
					"PROJECT.author": info.author,
					"PROJECT.description": info.description,
					"PROJECT.repository": info.repository.url.replace(/^git\+/, "").replace(/\.git$/, ""),
				};

				const modified = template(manifest, replacements)
					.split("\n")
					.map(line => line === "" ? "" : `// ${line}`)
					.join("\n");

				this.push(new VinylFile({
					path: SOURCES.MANIFEST,
					cwd: ROOT,
					contents: Buffer.from(modified),
				}));

				this.emit("end");
			},
		});
	};
}
