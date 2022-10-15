import { types as t } from "@babel/core";
import { Identifier, LVal } from "babel-types";

/**
 * Creates an L-value from JavaScript variable identifier syntax.
 *
 * e.g. `foo.bar` -> memberExpression(ident(foo), ident(bar))
 * e.g. `foo`     -> ident(foo)
 *
 * @param vpath The variable path.
 */
export function syntaxToLValue(vpath: string): LVal {
	const paths = vpath.split(".");
	if (paths.length === 1) {
		return t.identifier(paths[0]);
	}

	return paths.slice(1).reduce(
		(lv, ident) => t.memberExpression(lv, t.identifier(ident)),
		t.identifier(paths[0]),
	);
}

/**
 * Creates a JavaScript variable identifier syntax from an l-value.
 *
 * e.g. memberExpression(ident(foo), ident(bar)) -> `foo.bar`
 * e.g. ident(foo)                               -> `foo`
 *
 * @param lval The l-value AST.
 */
export function syntaxFromLValue(lval: LVal): string {
	switch (lval.type) {
		case "MemberExpression":
			return `${syntaxFromLValue(lval.object as LVal)}.${syntaxFromLValue(lval.property as Identifier)}`

		case "Identifier":
			return lval.name;

		default:
			throw new Error(`Unsupported node type: ${lval.type}`)
	}
}
