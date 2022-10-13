import {modulesMap} from "__debug";

declare interface Window {
	requireLazy: (deps: string[], callback: (...args: any[]) => any) => unknown;
	require: (dep: string) => unknown;
}

type FunctionsIn<T> = {
	[key in keyof T]: T[key] extends (...args: any[]) => any ? T[key] : never;
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
export function wrap
<T extends (...args: A) => R, A extends any[], R>
(func: T, wrapper: (thisValue: ThisType<T>, original: T, args: Parameters<T>) => R): T {
	const original = func;
	return function(this: ThisType<T>, ...args: Parameters<T>): R {
		return wrapper(this, original, args);
	} as T;
}

/**
 * Attempts to intercept a module export.
 *
 * @param name The module name.
 * @param prop The function to overwrite.
 * @param wrapper The wrapping function.
 *
 * @example
 * someModule.foo = wrap(someModule.foo, (self, func, args) => {
 *     return func.apply(self, args);
 * });
 */
export function tryIntercept
<Module extends any, Prop extends keyof FunctionsIn<MF>, MF extends FunctionsIn<Module> = FunctionsIn<Module>>
(name: string, prop: Prop, wrapper: (thisValue: ThisType<MF[Prop]>, original: MF[Prop], args: Parameters<MF[Prop]>) => ReturnType<MF[Prop]>) {
	tryModules<[Module, Prop, MF]>([name], (mod: Module) => {
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
export function intercept
<Module extends any, Prop extends keyof FunctionsIn<MF>, MF extends FunctionsIn<Module> = FunctionsIn<Module>>
(module: Module, prop: Prop, wrapper: (thisValue: ThisType<MF[Prop]>, original: MF[Prop], args: Parameters<MF[Prop]>) => ReturnType<MF[Prop]>) {
	const original = (module as unknown as MF)[prop];
	(module as unknown as MF)[prop] = function(this: ThisType<MF[Prop]>, ...args: Parameters<MF[Prop]>): ReturnType<MF[Prop]> {
		return wrapper(this, original as unknown as MF[Prop], args);
	} as MF[Prop];
}

/**
 * Attempts to re-exports a new set of values from a module.
 * If the module cannot be loaded, nothing will happen.
 *
 * @param name The name of the module to re-export.
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
export function reexport<M>
(name: string, module: M, factory: (exports: M) => any) {
	const moduleNameReal = canonicalize(name);

	// Get the module, forcing it to evaluate if not done yet.
	const internals = modulesMap[moduleNameReal];
	if (!internals.factoryFinished) {
		(unsafeWindow as unknown as Window).require(moduleNameReal);
	}

	// Get the original exports and rewrite them.
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
