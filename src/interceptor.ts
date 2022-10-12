import {modulesMap} from "__debug";

type FunctionsIn<T extends {}> = {
	[key in keyof T]: T[key] extends (...args: any[]) => infer R ? T[key] : never;
};

/**
 * Wraps a function, intercepting it.
 *
 * @param func The original function.
 * @param wrapper The wrapping function.
 *
 * @example
 * someModule.foo = wrap(someModule.foo, (self, func, args) => {
 *     return func.apply(self, args);
 * });
 */
export function wrap<T extends (...args: A) => R, A extends any[], R>
(func: T, wrapper: (thisValue: ThisType<T>, original: T, args: Parameters<T>) => R): T {
	const original = func;
	return function(this: ThisType<T>, ...args: Parameters<T>): R {
		return wrapper(this, original, args);
	} as T;
}

/**
 * Intercepts a module export.
 *
 * @param module The module.
 * @param prop The function to overwrite.
 * @param wrapper The wrapping function.
 *
 * @example
 * someModule.foo = wrap(someModule.foo, (self, func, args) => {
 *     return func.apply(self, args);
 * });
 */
export function intercept<M extends {[key: string]: (...args: any[]) => any}, P extends keyof FunctionsIn<M>>
(module: M, prop: P, wrapper: (thisValue: ThisType<M[P]>, original: M[P], args: Parameters<M[P]>) => ReturnType<M[P]>) {
	const original = module[prop];
	module[prop] = function(this: ThisType<M[P]>, ...args: Parameters<M[P]>): ReturnType<M[P]> {
		return wrapper(this, original, args);
	} as M[P];
}

/**
 * Re-exports a new set of values from a module.
 *
 * @param moduleName The name of the module to re-export.
 * @param module The module itself.
 * @param factory Generates new exports.
 *
 * @example
 * import * as SomeModule from "someModule";
 * rewrite("someModule", SomeModule, original => {
 *     return original;
 * });
 */
export function reexport<M>(moduleName: string, module: M, factory: (exports: M) => any) {
	const moduleNameReal = moduleName.replace(/^IG_/, ""); // <-- we use namespaced IDs

	const internals = modulesMap[moduleNameReal];
	const originals = internals.exports;
	const rewritten = factory(originals);
	internals.defaultExport = rewritten;
	internals.exports = typeof rewritten === 'object' ? rewritten : {default: rewritten};

	// Update the names for debugging.
	for (const exportName of Object.keys(internals.exports)) {
		const exportValue = internals.exports[exportName];
		if (typeof exportValue !== 'function') {
			continue;
		}

		const original = originals[exportName];
		if (original == null) {
			(exportValue as any).displayName = "<unknown> $ [intercepted]";
			continue;
		}

		(exportValue as any).displayName =
			(typeof original === 'function' ? original.displayName : original.name) +
			" $ [intercepted]";
	}
}
