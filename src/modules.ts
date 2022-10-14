import {modulesMap} from "__debug";

import {error,} from "./debug";

declare interface Window {
	requireLazy: (deps: string[], callback: (...args: any[]) => any) => {cancel: () => void};
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


type LoadManagerEntry = {cancel: null | (() => void), done: (() => void)};

/**
 * A utility class to track module loading and timeouts.
 */
export class LoadManager {
	private readonly name: string;
	private readonly requested: Set<string>;
	private readonly pendingMap: Map<string, LoadManagerEntry>;
	private timerId: number|null;

	public timeout: number;

	public constructor(name: string, onTimeout?: (this: LoadManager) => void) {
		this.name = name;
		this.requested = new Set();
		this.pendingMap = new Map();
		this.timerId = null;

		this.timeout = 10_000;
		this.onTimeout = onTimeout ?? this.onTimeout;
	}

	protected restartTimer() {
		if (this.timerId != null) {
			clearTimeout(this.timerId);
		}

		this.timerId = setTimeout(this.onTimeout.bind(this), this.timeout);
	}

	protected onTimeout() {
		error("%s: timed out loading modules", this.name, this.pending);
	}

	protected waitingDone(name: string): void {
		this.pendingMap.delete(name);
		if (this.pendingMap.size === 0 && this.timerId != null) {
			clearTimeout(this.timerId);
		}
	}

	protected waitingFor(name: string): LoadManagerEntry {
		const entry = {cancel: null, done: this.waitingDone.bind(this, name)};
		this.requested.add(name);
		this.pendingMap.set(name, entry);
		this.restartTimer();
		return entry;
	}

	/**
	 * The modules still waiting to be loaded.
	 */
	public get pending(): string[] {
		return Array.from(this.pendingMap.keys());
	}

	/**
	 * Stops the timer tracking when modules fail to load.
	 */
	public stopTimer(): void {
		if (this.timerId != null) {
			clearTimeout(this.timerId);
		}
	}
}

/**
 * Attempts to load the named modules.
 * If and when they are available, the callback will be called.
 *
 * @param manager The load manager, may be null.
 * @param names The module names.
 * @param callback The callback.
 */
export function tryModules<T extends Array<any>>(manager: LoadManager|null, names: string[], callback: (...modules: T) => void) {
	const window = (unsafeWindow as unknown as Window);
	const moduleIds = names.map(canonicalize);

	const promises: {[key in keyof T]: Promise<T[key]>} = moduleIds.map(id => new Promise((resolve, reject) => {
		const waiter = (manager as LoadManager & {waitingFor: LoadManager['waitingFor']})?.waitingFor(id);
		
		// Ask the Instagram module loader for the modules.
		const {cancel} = window.requireLazy([id], (module) => {
			if (waiter != null) {
				waiter.done();
			}

			resolve(module);
		});

		waiter.cancel = cancel;
	})) as any;

	Promise.all(promises).then((modules: T) => {
		callback(...modules);
	})
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
 * @param manager The load manager, may be null.
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
(manager: LoadManager|null, name: string, prop: Prop, wrapper: (thisValue: ThisType<MF[Prop]>, original: MF[Prop], args: Parameters<MF[Prop]>) => ReturnType<MF[Prop]>) {
	tryModules<[Module, Prop, MF]>(manager, [name], (mod: Module) => {
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
 * @param manager The load manager, may be null.
 * @param name The name of the module to re-export.
 * @param factory Generates new exports.
 *
 * @example
 * import * as SomeModule from "someModule";
 * tryRexport("someModule", original => {
 *     return original;
 * });
 */
export function tryReexport<M>(manager: LoadManager|null, name: string, factory: (exports: M) => any) {
	tryModules<[M]>(manager, [name], (mod: M) => {
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
