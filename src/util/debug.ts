export const PROJECT_NAME = "instagram-dm-pwa";

/**
 * Prints an info message to the debug console.
 *
 * @param format The format string.
 * @param args The format arguments.
 */
export function logInfo(format: string, ...args: any[]): void {
	console.log(
		"%c[%s]%c " + format,
		"color: #0c3",
		PROJECT_NAME,
		"color: unset",
		...args,
	);
}

/**
 * Prints an error message to the debug console.
 *
 * @param format The format string.
 * @param args The format arguments.
 */

export function logError(format: string, ...args: any[]): void {
	console.error(
		"%c[%s]%c " + format,
		"color: #c30",
		PROJECT_NAME,
		"color: unset",
		...args,
	);
}
