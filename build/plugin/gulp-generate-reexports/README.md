# gulp-generate-reexports

A [Gulp](https://gulpjs.com/) plugin that generates an index file re-exporting all the other modules that match a given pattern.

## Usage

```js
const rollup = require("rollup");
const reexports = require("gulp-generate-reexports");

const REEXPORT_OPTIONS = {
	patterns: ["lib/*.js"],
    outputFile: "lib/index.js",
}

const files = gulp.src(["src/*.js"])
    .pipe(reexports(REEXPORT_OPTIONS))
    .pipe(gulp.dest("dist"));
```

## Options

**`patterns`: string[]**  
Glob patterns for which files to generate re-exports for.

**`outputFile`: string**  
The output file path.

**`cwd`: string**  
The output file's cwd.

**`mapModulePathToIdentifier`: (string) => string**  
A function that maps a module file path to an export identifier.

## License

MIT. (C) 2022 eth-p
