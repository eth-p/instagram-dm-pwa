import { logError } from "./debug";

/**
 *
 * @param what
 * @param fn
 */
export function guardAsync(what: string, fn: () => Promise<any>): void {
	fn().catch(error => {
		logError("Guard failed: %s", what, error);
	})
}

/**
 * Wraps a function that will call an alternate function if it throws an error.
 *
 * @param fn The function to call.
 * @param alternate The fallback function.
 * @param name The name to display in the error message.
 *
 * @returns The wrapped function.
 */
export function fallbackOnError<F extends (this: T, ...args: A) => R, A extends [], R, T>(fn: F, alternate: F, name?: string): F {
	const reportName = name ?? 
		(fn as F & {displayName: string}).displayName ??
		(alternate as F & {displayName: string}).displayName;

	// Fallback function.
	let lastError: Error | any;
	function fallback(ex: Error | any, thisArg: T, args: A): R {
		const isSame =
			(ex instanceof Error && lastError instanceof Error && ex.stack === lastError.stack) ||
			(ex === lastError);

		if (!isSame) {
			logError("Resorting to fallback for '%s'.\n", reportName, ex);
		}

		return alternate.apply(thisArg, args);
	};

	// Wrapper function.
	return function tryOrFallback(this: T, ...args: A): R {
		let result: R;

		// Call the function.
		// If it's not a promise, return the result.
		try {
			result = fn.apply(this, args);
			if (typeof result !== "object" || (typeof (result as Promise<unknown>).then !== "function")) {
				return result;
			}
		} catch (ex) {
			return fallback(ex, this, args);
		}

		// Return a wrapped promise.
		return (result as Promise<unknown>).then((d: any) => d, (ex: Error) => {
			return fallback;
		}) as R;
	} as F;
}
