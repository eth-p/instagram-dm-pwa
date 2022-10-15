import type { ImportDeclaration } from "babel-types";
import type { NodePath } from "babel-traverse";

import { declare } from "@babel/helper-plugin-utils";

export interface Options {
	rewrite: (name: string, source: string) => string;
}

export default declare<{}>((api, options: Options) => {
	api.assertVersion(7);

	return {
		name: "transform-rewrite-modules",
		visitor: {
			ImportDeclaration(path: NodePath<ImportDeclaration>) {
				path.node.source.value = options.rewrite(path.node.source.value, this.file.opts.sourceFileName);
			}
		},
	};

});
