import { PROJECT_NAME, OPENED_IN_PWA, logError, logInfo } from "./util/debug";
import { require } from "./util/module";

// Ensure that any redirects are treated as part of the PWA.
if (OPENED_IN_PWA && unsafeWindow.name !== PROJECT_NAME) {
	unsafeWindow.name = PROJECT_NAME;
}

// If we're not in the DM page already, navigate to it since this userscript creates a chat app.
if (unsafeWindow.location.pathname === "/" && OPENED_IN_PWA) {
	unsafeWindow.history.replaceState({}, "", "/direct/t/?utm_source=pwa_homescreen");
	unsafeWindow.location = "/direct/t/?utm_source=pwa_homescreen";
}

/**
 * Declares a feature.
 *
 * @param name The feature name.
 * @param dependencies The modules that the feature depends on.
 * @param callback The callback function to run when the feature's dependencies are loaded.
 */
function feature(name: string, dependencies: string[], callback: (...args: any[]) => Promise<unknown>) {
	if (!OPENED_IN_PWA) return;
	const start = Date.now();

	function showEnableMessage() {
		logInfo(
			"Feature '%c%s%c' enabled in %d ms.",
			"color: #999", name, "color: unset",
			(Date.now() - start),
		);
	}

	function showErrorMessage(error: Error) {
		logError(
			"Feature '%c%s%c' failed to load.\n",
			"color: #999", name, "color: unset",
			error,
		);
	}

	require(dependencies)
		.then((modules) => callback(...modules))
		.then(showEnableMessage)
		.catch(showErrorMessage);
}
