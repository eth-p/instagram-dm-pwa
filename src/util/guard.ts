/**
 *
 * @param what
 * @param fn
 */
import { logError } from "./debug";

export function guardAsync(what: string, fn: () => Promise<any>): void {
	fn().catch(error => {
		logError("Guard failed: %s", what, error);
	})
}
