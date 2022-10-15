import type {
	AssignmentExpression,
	ExportNamedDeclaration, Expression,
	MemberExpression,
	Program,
} from "babel-types";

import { NodePath } from "babel-traverse";
import { types as t } from "@babel/core";

import { ConvertToIdentifierFunction } from "./util";
import { syntaxToLValue, syntaxFromLValue } from "babel-helper-easy-ident";


export default function transformExports(root: NodePath<Program>, module: string, exportsVariable: string, convertToIdentifier: ConvertToIdentifierFunction): void {
	function ensureParentNotUndefined(hasGenerated: Set<string>, output: Expression[], ident: MemberExpression) {
		const id = syntaxFromLValue(ident);
		if (id === exportsVariable) return;
		if (hasGenerated.has(id)) return;
		hasGenerated.add(id);

		output.push(t.expressionStatement(
			/* expression: */ t.assignmentExpression(
				/* operator: */ "=",
				/* left:     */ ident,
				/* right:    */ t.logicalExpression(
					/* operator: */ "??",
					/* left:     */ ident,
					/* right:    */ t.objectExpression([]),
				),
			),
		));
	}

	root.traverse({
		// TODO: Other export declarations.

		ExportNamedDeclaration(node: NodePath<ExportNamedDeclaration>) {
			const hasGeneratedEnsureAssignment = new Set<string>;
			const generatedAssignments = [];

			for (const specifier of node.node.specifiers) {
				const exportIdentifier = convertToIdentifier(module, specifier.exported.name);

				// Create the assignment to export the local.
				const exportPath = `${exportsVariable}.` + exportIdentifier;
				const lVal = syntaxToLValue(exportPath);
				const assignment = t.assignmentExpression(
					/* op:    */ "=",
					/* left:  */ lVal,
					/* right: */ specifier.local,
				) as AssignmentExpression;

				// Ensure the export object exists.
				if (lVal.type === "MemberExpression") {
					ensureParentNotUndefined(hasGeneratedEnsureAssignment, generatedAssignments, lVal.object as MemberExpression);
				}

				// Assign.
				assignment.loc = node.node.loc;
				generatedAssignments.push(assignment);
			}

			// Replace the export with the assignment expressions.
			node.replaceInline(generatedAssignments);
		},
	});
}
