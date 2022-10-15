import type { CommentBlock, CommentLine } from "babel-types";
import type { NodePath } from "babel-traverse";

import { declare } from "@babel/helper-plugin-utils";
import { Node } from "babel-core";

function isDocComment(comment: CommentBlock | CommentLine): boolean {
	return comment.value.startsWith("*");
}

function isRollupAnnotation(comment: CommentBlock | CommentLine): boolean {
	return comment.type === "CommentBlock" && comment.value === "#__PURE__";
}

interface Options {
	keepRollupAnnotations?: boolean;
}

export default declare<{}>((api, options: Options) => {
	api.assertVersion(7);

	const shouldBeKept = (c: CommentLine | CommentBlock) => {
		if (isDocComment(c)) {
			return false;
		}

		if (!options.keepRollupAnnotations && isRollupAnnotation(c)) {
			return false;
		}

		return true;
	};

	function visit(path: NodePath<Node>) {
		const { node } = path;
		for (const s of ["leadingComments", "innerComments", "trailingComments"]) {
			const comments = node[s];
			if (comments != null) {
				comments.splice(
					0, comments.length,
					...comments.filter(shouldBeKept),
				);
			}
		}
	}

	return {
		name: "transform-remove-doc-comments",
		visitor: {
			Program: { exit: visit },
			Expression: visit,
			Statement: visit,
			FunctionDeclaration: visit,
		},
	};
});
