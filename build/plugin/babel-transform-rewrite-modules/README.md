# babel-transform-rewrite-modules
A babel transformer that rewrites ES6 module import paths.

## Usage

```js
plugins: [
	[require("babel-transform-rewrite-modules/index"), {
		rewrite: (name, sourceFile) => {
			return "my_" + name;
		}
	}]
]
```

## Example

From:

```js
import {foo} from "bar";
```

To:

```js
import {foo} from "my_bar";
```

## License

MIT. (C) 2022 eth-p
