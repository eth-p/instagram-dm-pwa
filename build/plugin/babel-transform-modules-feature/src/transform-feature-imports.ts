import type {
	CommentLine, ExpressionStatement,
	Identifier,
	ImportSpecifier, Program, StringLiteral,
	VariableDeclaration,
	VariableDeclarator,
} from "babel-types";

import { NodePath } from "babel-traverse";
import { Seq } from "immutable";
import { types as t } from "@babel/core";

import type { ImportedModule } from "./remove-esnext-imports";

/**
 * Converts a module name to a safe identifier name.
 * @param name The module name.
 */
function moduleNameToIdentifier(name: string): string {
	const safe = name
		.replace(/[^a-z_]/ig, "_")
		.replace(/^_+/, "")
		.replace(/_+$/, "");

	if (/^[0-9]/.test(safe)) {
		return `_${safe}`;
	}

	return safe;
}

/**
 * Generates the AST nodes that will be used in the "require" function.
 *
 * This consists of the string literals for the modules IDs, and the callback
 * function arguments corresponding to said module IDs.
 *
 * @param module The module import.
 */
function generateRequireAST(module: ImportedModule): { id: StringLiteral, arg: Identifier, aliases: VariableDeclarator[] } {
	let id: StringLiteral;
	let arg: Identifier;
	let aliases: VariableDeclarator[];

	// Generate the callback argument for this module.
	//   e.g. import foo from "module"
	//   e.g. import * as foo from "module"
	const nonDestructuringImports = module.imports.filter(f => f.type === "ImportDefaultSpecifier" || f.type === "ImportNamespaceSpecifier");
	if (nonDestructuringImports.length > 0) {
		// Use the first name it was imported as.
		arg = nonDestructuringImports[0].local;
	} else {
		// Synthesize a name to import it as.
		arg = t.Identifier(`__${moduleNameToIdentifier(module.module)}__`);
	}

	// Generate the literal used for the module ID.
	id = t.stringLiteral(module.module);
	id.loc = arg.loc;

	// Generate any aliases, if needed.
	if (nonDestructuringImports.length > 1) {
		aliases = nonDestructuringImports.slice(1).map(aliasIdentifier => {
			return t.variableDeclarator(
				/* id:   */ aliasIdentifier,
				/* init: */ arg,
			);
		});
	}

	// Return.
	return {
		id,
		arg,
		aliases: aliases ?? [],
	};
}

/**
 * Generates the AST nodes for imports that can be directly destructured.
 *
 * @param module The module import.
 * @param arg The identifier used to import the module.
 *
 * @example
 * import { foo } from "bar";
 */
function generateDestructureAST(module: ImportedModule, arg: Identifier): VariableDeclarator[] {
	const properties = Seq(module.imports)
		.filter(spec => spec.type === "ImportSpecifier")
		.filter((spec: ImportSpecifier) => spec.imported.name === spec.local.name)
		.map((spec: ImportSpecifier) => {
			return t.objectProperty(
				/* key:       */ spec.local,
				/* value:     */ spec.imported,
				/* computed:  */ false,
				/* shorthand: */ true,
			);
		})
		.toArray();

	if (properties.length === 0) {
		return [];
	}

	return t.variableDeclarator(
		/* id:   */ t.objectPattern(properties),
		/* init: */ arg,
	);
}

/**
 * Generates the AST nodes for imports that cannot be destructured.
 *
 * @param module The module import.
 * @param arg The identifier used to import the module.
 *
 * @example
 * import { foo as bar } from "bar";
 */
function generateAccessAST(module: ImportedModule, arg: Identifier): VariableDeclarator[] {
	return Seq(module.imports)
		.filter(spec => spec.type === "ImportSpecifier")
		.filter((spec: ImportSpecifier) => spec.imported.name !== spec.local.name)
		.map((spec: ImportSpecifier) => {
			return t.variableDeclarator(
				/* key:   */ spec.local,
				/* value: */ t.memberExpression(
					/* object:   */ arg,
					/* property: */ spec.imported,
				),
			);
		})
		.toArray();
}

function generate(module: ImportedModule): { id: StringLiteral, arg: Identifier, declaration: VariableDeclaration | null } {
	const { id, arg, aliases } = generateRequireAST(module);
	const declaratorsForDestructure = generateDestructureAST(module, arg);
	const declaratorsForAccess = generateAccessAST(module, arg);

	const declarators = aliases.concat(declaratorsForDestructure, declaratorsForAccess);
	const declaration = declarators.length === 0 ? null : t.variableDeclaration(
		/* kind:         */ "const",
		/* declarations: */ declarators,
	);

	return { id, arg, declaration };
}

interface Options {
	insertCommentAtStart?: string | null;
	insertCommentAtEnd?: string | null;
	defineFunction: string;
}

export default function transformFeatureImports(root: NodePath<Program>, name: string, imports: ImportedModule[], opts: Options): void {

	// Generate the AST nodes necessary for the transformation.
	const requireArgs: Identifier[] = [];
	const requireIds: StringLiteral[] = [];
	const variableDeclarations: VariableDeclaration[] = [];

	for (const module of imports) {
		const generated = generate(module);

		requireArgs.push(generated.arg);
		requireIds.push(generated.id);
		if (generated.declaration != null) {
			variableDeclarations.push(generated.declaration);
		}
	}

	// Insert the variable declarations at the top of the script.
	// Make sure to steal the comments, too.
	if (variableDeclarations.length > 0) {
		const comments = root.node.body[0].leadingComments;
		root.node.body[0].leadingComments = [
			({ type: "CommentLine", value: " End of imports." } as CommentLine),
		];

		root.node.body.unshift(...variableDeclarations);
		root.node.body[0].leadingComments = comments;
	}

	// Wrap the entire program body to use a require statement.
	const originalBody = root.node.body;
	const requireFunction = t.Identifier(opts.defineFunction);
	const wrapped: ExpressionStatement = t.expressionStatement(
		/* expression: */ t.callExpression(
			/* callee:    */ requireFunction,
			/* arguments: */ [
				t.stringLiteral(name),
				t.arrayExpression(requireIds),
				t.arrowFunctionExpression(
					/* params: */ requireArgs,
					/* body:   */ t.blockStatement(root.node.body),
					/* async:  */ true,
				),
			],
		),
	);

	wrapped.leadingComments = root.node.body[0].leadingComments;
	root.node.body[0].leadingComments = undefined;
	root.node.body = [wrapped];

	// Insert comments.
	if (opts.insertCommentAtStart != null) {
		const node = originalBody[0];
		node.leadingComments = node.leadingComments ?? [];
		node.leadingComments.unshift({
			type: "CommentLine", value: opts.insertCommentAtStart
		} as CommentLine);
	}

	if (opts.insertCommentAtEnd != null) {
		const node = originalBody[originalBody.length - 1];
		node.trailingComments = root.node.body[0].trailingComments ?? [];
		node.trailingComments.unshift({
			type: "CommentLine", value: "\n//" + opts.insertCommentAtEnd
		} as CommentLine);
	}
}
