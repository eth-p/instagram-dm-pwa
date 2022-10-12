declare interface BootstrapProvided extends Window {
	logMsg: (format: string, ...args: any[]) => void;
	logErr: (format: string, ...args: any[]) => void;
}

/**
 * Prints an info message to the debug console.
 *
 * @param format The format string.
 * @param args The format arguments.
 */
export const info: (format: string, ...args: any[]) => void = (window as unknown as BootstrapProvided).logMsg;

/**
 * Prints an error message to the debug console.
 *
 * @param format The format string.
 * @param args The format arguments.
 */
export const error: (format: string, ...args: any[]) => void = (window as unknown as BootstrapProvided).logErr;
