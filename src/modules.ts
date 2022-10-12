import {modulesMap} from "__debug";

declare interface Window {
	requireLazy: (deps: string[], callback: Function) => unknown;
}

type FunctionsIn<T extends {}> = {
	[key in keyof T]: T[key] extends (...args: any[]) => infer R ? T[key] : never;
};

/**
 * Canonicalizes a module name.
 * This strips the fake "IG_" prefixes we use for namespacing.
 * 
 * @param name The module name.
 * @returns The canon module name.
 */
function canonicalize(name: string) {
	return name.replace(/^IG_/, "");
}



/**
 * Attempts to load the named modules.
 * If and when they are available, the callback will be called.
 * 
 * @param names The module names. 
 * @param callback The callback.
 */
 export function tryModules<T extends Array<any>>(names: string[], callback: (...modules: T) => void) {
	const window = (unsafeWindow as unknown as Window);
	window.requireLazy(names.map(canonicalize), callback);

	// TODO: Error/timeout handling.
}

/**
 * Wraps a function, allowing it to be hooked.
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
 * Attempts to intercept a module export.
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
export function tryIntercept<M extends {[key: string]: (...args: any[]) => any}, P extends keyof FunctionsIn<M>>
(name: string, prop: P, wrapper: (thisValue: ThisType<M[P]>, original: M[P], args: Parameters<M[P]>) => ReturnType<M[P]>) {
	tryModules<[M]>([name], (mod: M) => {
		intercept(mod, prop, wrapper);
	});
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
 * Attempts to re-exports a new set of values from a module.
 * If the module cannot be loaded, nothing will happen.
 *
 * @param moduleName The name of the module to re-export.
 * @param module The module itself.
 * @param factory Generates new exports.
 *
 * @example
 * import * as SomeModule from "someModule";
 * tryRexport("someModule", original => {
 *     return original;
 * });
 */
export function tryReexport<M>(name: string, factory: (exports: M) => any) {
	tryModules<[M]>([name], (mod: M) => {
		reexport(name, mod, factory);
	});
}

/**
 * Re-exports a new set of values from a module.
 *
 * @param name The name of the module to re-export.
 * @param module The module itself.
 * @param factory Generates new exports.
 *
 * @example
 * import * as SomeModule from "someModule";
 * reexport("someModule", SomeModule, original => {
 *     return original;
 * });
 */
export function reexport<M>(name: string, module: M, factory: (exports: M) => any) {
	const moduleNameReal = canonicalize(name);

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
