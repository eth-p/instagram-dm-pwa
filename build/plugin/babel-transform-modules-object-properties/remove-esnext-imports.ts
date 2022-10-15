import { NodePath } from "babel-traverse";
import {
	ImportDeclaration,
	ImportDefaultSpecifier,
	ImportNamespaceSpecifier,
	ImportSpecifier,
} from "babel-types";

export interface ImportedModule {
	module: string;
	imports: Array<ImportSpecifier|ImportDefaultSpecifier|ImportNamespaceSpecifier>;
}

export default function removeEsnextImports(path: NodePath, isAffected: (name: string) => boolean): Map<string, ImportedModule> {
	const imports = new Map<string, ImportedModule>();

	// Collect the imports and remove the declarations.
	path.traverse({
		ImportDeclaration(path: NodePath) {
			const node = path.node as ImportDeclaration;
			const moduleName = node.source.value;
			const specifiers = node.specifiers;

			if (!isAffected(moduleName)) {
				return;
			}

			const info: ImportedModule = imports.get(moduleName) ?? (() => {
				const initial: ImportedModule = {
					module: moduleName,
					imports: [],
				};

				imports.set(moduleName, initial);
				return initial;
			})();

			// Add the imports.
			info.imports.push(...specifiers);

			// Remove the node.
			path.remove();
		},
	});

	return imports;
}
