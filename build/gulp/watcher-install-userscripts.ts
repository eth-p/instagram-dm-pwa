import open from "open";
import { promisify } from "util";
import * as http from "http";
import { Transform, TransformCallback } from "stream";
import VinylFile from "vinyl";

interface Installer {
	files: Map<string, Buffer>;

	start(selfClosing?: boolean);

	stop();

	install(file: string);

	printBanner?();
}

/**
 * A rollup plugin that opens the bundled userscript file in the default browser.
 */
export default function createInstaller(serverPort?: number): Installer {
	const port = serverPort ?? 31459;
	const files = new Map<string, Buffer>();

	let serving = false;
	let selfClosing = false;

	const server = http.createServer((req, res) => {
		const path = req.url.substring(1);
		if (files.has(path)) {
			res.writeHead(200, { "Content-Type": "application/javascript" });
			res.end(files.get(path));

			if (selfClosing) {
				server.close();
			}
		} else {
			res.writeHead(404);
			res.end();
		}
	});

	return {
		files,

		start(isSelfClosing?: boolean) {
			if (serving) return;
			if (isSelfClosing !== undefined) selfClosing = isSelfClosing;
			serving = true;
			server.listen(port, "127.0.0.1");
		},

		stop() {
			if (!serving) return;
			serving = false;
			server.close();
		},

		async install(file: string) {
			if (!serving) {
				throw new Error("must be serving");
			}

			await open(`http://localhost:${port}/${file}`);
		},
	};
}

export function gulp(installer: Installer | null, requirePrompt: boolean): () => Transform {
	const inst = installer ?? createInstaller();
	if (requirePrompt) {
		bindPrompt(inst);
		inst.start(false);
	}

	return () => {
		const stream = new Transform({
			objectMode: true,
			async transform(chunk: VinylFile, encoding: BufferEncoding, callback: TransformCallback) {
				callback(null, chunk);

				if (chunk.isBuffer()) {
					inst.files.set(chunk.relative, chunk.contents);
				}

				const contents = chunk.contents;
				// TODO: support streams, maybe?


				if (inst.printBanner) {
					inst.printBanner();
				}

				if (!requirePrompt) {
					inst.start(true);
					inst.install(chunk.relative);
				}
			},
		});

		return stream;
	};
}

function bindPrompt(installer: Installer) {
	const start = installer.start;
	const stop = installer.stop;

	const stdinListener = (data) => {
		switch (String.fromCharCode(...data)) {
			case "\x03": // CTRL+C
			case "\x04": // CTRL+D
			case "q":
				process.kill(process.pid, "SIGINT");
				return;

			case "i":
				for (const file of installer.files.keys()) {
					installer.install(file);
				}
				return;
		}
	};

	installer.printBanner = () => {
		setTimeout(() => {
			console.log("----------------------------");
			console.log("   Quit:     ctrl+c");
			console.log("   Install:  i");
			console.log("----------------------------");
		}, 0);
	};

	installer.start = function(...args: any[]) {
		start.apply(this, args);
		process.stdin.setRawMode(true);
		process.stdin.on("data", stdinListener);
	};

	installer.stop = function(...args: any[]) {
		stop.apply(this, args);
		process.stdin.setRawMode(false);
		process.stdin.removeListener("data", stdinListener);
	};
}
