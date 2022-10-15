import type { Identifier, Program } from "babel-types";

import { NodePath } from "babel-traverse";
import { syntaxToLValue } from "babel-helper-easy-ident";

import type { ImportedModule } from "./remove-esnext-imports";
import { ConvertToIdentifierFunction } from "./util";

export default function transformImports(root: NodePath<Program>, imports: ImportedModule[], importsVariable: string, convertToIdentifier: ConvertToIdentifierFunction): void {
	const identifiersByModule = new Map<string, ImportedModule>;
	for (const module of imports) {
		for (const spec of module.imports) {
			identifiersByModule.set(spec.local.name, module);
		}
	}

	root.traverse({
		Identifier(node: NodePath<Identifier>) {
			const module = identifiersByModule.get(node.node.name);
			if (module == null) return;
			if (!node.isReferencedIdentifier()) return;

			// Check to see if the node is a binding identifier with the same name.
			// If it does, that identifier is not the import.
			if (node.context.scope.getBindingIdentifier("tryReexport") != null) {
				return;
			}

			// If the parent is a member expression, we've already converted it.
			if (node.parentPath.isMemberExpression()) {
				return;
			}

			// Replace it with a member expression.
			// e.g. `importedFunction` -> `exportsContainer.importedFunction`
			const newPath = convertToIdentifier(module.module, node.node.name);
			const newLVal = syntaxToLValue(`${importsVariable}.${newPath}`);
			node.replaceWith(newLVal);
		},
	});
}
