import type __debug from "__debug";

import { logInfo } from "./debug";

/**
 * The Window object of the Instagram website.
 */
declare const unsafeWindow: Window & {
	requireLazy: (ids: string[], callback: (...args: any[]) => any) => { cancel: () => void };
	require: (id: string) => unknown;
};

/**
 * A Promise that resolves when {@link unsafeWindow#require} and {@link unsafeWindow#requireLazy} become available.
 *
 * @internal
 */
export const __WAIT_FOR_REQUIRE: Promise<void> = new Promise((resolve, reject) => {
	const CHECK_INTERVAL = 10;
	const CHECK_TIMEOUT = 10_000;

	logInfo("Bootstrap started.");
	const start = Date.now();
	const check = () => {
		if (unsafeWindow.require != null || unsafeWindow.requireLazy != null) {
			logInfo("Bootstrap completed in %d ms.", Date.now() - start);
			resolve();
			return;
		}

		if ((Date.now() - start) > CHECK_TIMEOUT) {
			reject(new Error("timed out bootstrapping"));
			return;
		}

		setTimeout(check, CHECK_INTERVAL);
	};

	check();
});

/**
 * A symbol inserted into the metadata for a module object.
 */
export const ID_TAG = Symbol("Module ID");

/**
 * A module identifier.
 */
export type ModuleID = string;

/**
 * A module.
 */
export type Module<T> = T extends object ? T : never;

/**
 * Requires a single module from the Instagram page.
 *
 * @param id The module ID.
 * @returns The specified module.
 */
export function require<T>(id: ModuleID): Promise<Module<T>>;

/**
 * Requires multiple modules from the Instagram page.
 *
 * @param ids The module IDs.
 * @returns The specified modules.
 */
export function require<T extends [...any]>(ids: ModuleID[]): Promise<{ [key in keyof T]: Module<T[key]> }>;

/**
 * @internal
 */
export async function require<T extends []>(ids: ModuleID | ModuleID[]): Promise<T> {
	if (typeof ids === "string") {
		const module = await require<[T]>([ids] as string[]);
		return module[0] as T;
	}

	// Canonicalize the ID.
	// This is needed since we can't transform dynamic imports at compile time.
	for (let i = 0; i < ids.length; i++) {
		if (ids[i].startsWith("IG_")) {
			ids[i] = ids[i].substring(3);
		}
	}

	// Load the modules.
	return new Promise((resolve, reject) => {
		let timeout = setTimeout(() => {
			reject(new Error(`Timed out waiting for one of: [${ids.join(", ")}]`));
		}, require.timeout);

		unsafeWindow.requireLazy(ids, (...modules: T) => {
			clearTimeout(timeout);

			for (let i = 0; i < ids.length; i++) {
				Reflect.set(modules[i], ID_TAG, ids[i]);
			}

			resolve(modules);
		});
	});
}

export namespace require {

	/**
	 * The number of milliseconds until require() calls time out.
	 */
	export let timeout: number = 10_000;

}

/**
 * Gets the ID of an already-loaded module.
 *
 * @param module The module instance.
 * @returns The module's ID string.
 */
export function getModuleID<T extends Module<any>>(module: T): ModuleID {
	if (module == null) {
		throw new TypeError("getModuleID: received null/undefined module");
	}

	return Reflect.get(module as object, ID_TAG);
}

/**
 * Immediately require a module.
 * This may throw an error if:
 *
 * - The module is not yet defined.
 * - The module is not yet loaded.
 * - The module's dependencies are not yet loaded.
 *
 * @param id The module ID.
 * @returns The module instance.
 * @throws ReferenceError
 */
export function UNSAFE_require<T>(id: ModuleID): T | never {
	const require = unsafeWindow.require;
	if (require == null) {
		throw new ReferenceError("the Instagram 'require' function has not yet loaded");
	}

	const module = unsafeWindow.require(id);
	Reflect.set(module as object, ID_TAG, id);
	return module as T;
}

/**
 * Helper type to get only the functions within an object.
 */
type FunctionsIn<T> = {
	[key in keyof T]: T[key] extends (...args: any[]) => any ? T[key] : never;
};

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
 * Re-exports a new set of values from a module.
 *
 * @param module The module.
 * @param factory Generates new exports.
 *
 * @example
 * import * as SomeModule from "someModule";
 * reexport("someModule", SomeModule, original => {
 *     return original;
 * });
 */
export function reexport<M>(module: M, factory: (exports: M) => any) {
	const MODULE_MAP = UNSAFE_require<typeof __debug>("__debug").modulesMap;
	const MODULE_ID = getModuleID(module);

	// Get the module, forcing it to evaluate if not done yet.
	const internals = MODULE_MAP[MODULE_ID];
	if (!internals.factoryFinished) {
		UNSAFE_require(MODULE_ID);
	}

	// Get the original exports and rewrite them.
	const originals = internals.exports;
	const rewritten = factory(module);
	internals.defaultExport = rewritten;
	internals.exports = typeof rewritten === 'object' ? rewritten : {default: rewritten};

	Reflect.set(internals.exports, ID_TAG, MODULE_ID);
	Reflect.set(internals.defaultExport, ID_TAG, MODULE_ID);

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
