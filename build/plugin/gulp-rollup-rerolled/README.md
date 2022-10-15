# gulp-rollup-rerolled
An in-memory [Gulp](https://gulpjs.com/) plugin that runs files through [Rollup](https://rollupjs.org/).  

Unlike the alternatives, this plugin is designed to work entirely on in-memory Vinyl files.  
This allows it to be used as an intermediary, rather than a file source. 

## Usage

```js
const rollup = require("rollup");
const rerolled = require("gulp-rollup-rerolled");

const ROLLUP_OPTIONS = {
	input: "src/index.ts",
    output: {
		format: "es"
    }
}

const files = gulp.src(["src/*.ts"])
    .pipe(/* anything, e.g. typescript */)
    .pipe(rerolled(rollup, ROLLUP_OPTIONS))
    .pipe(gulp.dest("dist"));
```

## License

MIT. (C) 2022 eth-p
