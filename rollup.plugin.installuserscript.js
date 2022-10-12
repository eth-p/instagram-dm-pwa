import open from "open";
import {promisify} from "util";
import * as http from "http";

/**
 * A rollup plugin that opens the bundled userscript file in the default browser.
 */
export default function installUserscripts(serverPort, noPrompt) {
	let watching = false;
	let prompt = !noPrompt;

	const port = serverPort ?? 31459;
	const files = {};
	const server = http.createServer((req, res) => {
		const path = req.url.substring(1);
		if (path in files) {
			res.writeHead(200, {'Content-Type': 'application.javascript'});
			res.end(files[path]);

			if (!watching) {
				server.close();
			}
		} else {
			res.writeHead(404);
			res.end();
		}
	});

	server.listen(port, "127.0.0.1");

	if (prompt) {
		process.stdin.setRawMode(true);
		process.stdin.on('data', data => {
			switch (String.fromCharCode(...data)) {
				case '\x03': // CTRL+C
				case '\x04': // CTRL+D
				case 'q':
					process.kill(process.pid, "SIGINT");
					return;

				case 'i':
					for (const file of Object.keys(files)) {
						open(`http://localhost:${port}/${file}`);
					}
					return;
			}
		})
	}

	return {
		async writeBundle(config, modules) {
			watching = this.meta.watchMode;

			// Display prompt.
			if (prompt) {
				process.nextTick(() => {
					console.log(" ...................  Quit:     ctrl+c");
					console.log(" ...................  Install:  i");
				})
			}

			// Update files (and open them if not prompting)
			for (const module of Object.values(modules)) {
				const file = module.fileName;
				if (file.endsWith(".user.js")) {
					files[file] = module.code;

					// Open the file in the browser to install.
					if (!prompt) {
						await open(`http://localhost:${port}/${file}`);
						return;
					}
				}
			}
		},

		async closeWatcher() {
			return promisify(server.close).call(server);
		},
	}
}
