import BabelModulesTransformObjectProperties from "babel-transform-modules-object-properties";
import BabelTransformRemoveDocComments from "babel-transform-remove-doc-comments";

import { convertModuleNameToIdentifier, isLocalModule } from "./utils";


/**
 * A Babel plugin and associated configuration for importing project-lib modules through the {@code $lib} variable.
 * This is the analogy to {@link BABEL_PLUGIN_EXPORT_LIB_MODULES}
 */
export const BABEL_PLUGIN_IMPORT_LIB_MODULES = [BabelModulesTransformObjectProperties, {
	isAffected: isLocalModule,
	importsVariable: "$lib",
	convertToIdentifier: (module: string, name: string) => convertModuleNameToIdentifier(module) + `.${name}`,
}];

/**
 * A Babel plugin and associated configuration for importing project-lib modules through the {@code $lib} variable that
 * they were exported into from the library modules.
 */
export const BABEL_PLUGIN_EXPORT_LIB_MODULES = [BabelModulesTransformObjectProperties, {
	isAffected: isLocalModule,
	exportsVariable: "$lib",
	convertToIdentifier: (module: string, name: string) => name,
}];

/**
 * A Babel plugin and associated configuration for stripping documentation comments.
 */
export const BABEL_PLUGIN_REMOVE_DOC_COMMENTS = [BabelTransformRemoveDocComments];
