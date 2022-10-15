import type {
	CallExpression,
	CommentLine, Expression, ExpressionStatement,
	Identifier,
	ImportSpecifier, Program, StringLiteral,
	VariableDeclaration,
	VariableDeclarator,
} from "babel-types";

import { NodePath } from "babel-traverse";
import { Seq } from "immutable";
import { types as t } from "@babel/core";

import type { ImportedModule } from "./remove-esnext-imports";
import { syntaxToLValue } from "babel-helper-easy-ident";

interface Options {
	importFunction: string;
}

export default function transformFeatureDynamicImports(root: NodePath<Program>, opts: Options): void {
	const importFunctionLValue = syntaxToLValue(opts.importFunction);

	root.traverse({
		CallExpression(path: NodePath<CallExpression>) {
			if (!(path.get("callee") as any).isImport()) return;

			path.node.callee = importFunctionLValue as Expression;
		},
	});
}
