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

export const {
	OPENED_IN_PWA, OPENED_REASON
}: {

	/**
	 * True if the website was opened as a progressive web app.
	 * This will be the case when:
	 *
	 * - "?utm_source=pwa_homescreen"
	 * - "?utm_source=web_push_encrypted" and in the DM inbox
	 * - The page was redirected by this userscript.
	 */
	OPENED_IN_PWA: boolean;

	/**
	 * The suspected reason for the PWA being opened.
	 */
	OPENED_REASON: "notification" | "none";

} = (() => {
	const queryParameters = new Map<string, string>(
		(window.location.search ?? "")
			.substring(1)
			.split("&")
			.map((param) => param.split("=", 2) as [string, string])
			.map((param) => param.map(decodeURI) as [string, string])
			.map(([name, value]) => [name, value ?? ""]),
	);

	// If the window name is set to the project name, we've come from the PWA at some point.
	if (window.name === PROJECT_NAME) {
		return { OPENED_IN_PWA: true, OPENED_REASON: "none" };
	}

	// If the `utm_source` tracking parameter is "pwa_homescreen", we're in the PWA.
	if (queryParameters.get("utm_source") === "pwa_homescreen") {
		return { OPENED_IN_PWA: true, OPENED_REASON: "none" };
	}

	// If the `utm_source` is "web_push_encrypted" and we're in the DM page, we're in the PWA.
	if (
		queryParameters.get("utm_source") === "web_push_encrypted" &&
		window.location.pathname.startsWith("/direct/")
	) {
		return { OPENED_IN_PWA: true, OPENED_REASON: "notification" };
	}

	return { OPENED_IN_PWA: false, OPENED_REASON: "none" };
})();
