#!/usr/bin/env node
process.argv = [
	...process.argv.slice(0, 2),
	`--gulpfile=${__dirname}/gulp`,
	...process.argv.slice(2),
]

// Run gulp.
process.env.TS_NODE_PROJECT = __dirname;
require("ts-node/register");
require("gulp-cli")();
