import { PROJECT_NAME, logError, logInfo } from "./util/debug";
import { require } from "./util/module";

let isPWA = false;

// Only act on the PWA.
//
// The PWA entrypoint is set to "/?utm_source=pwa_homescreen" for tracking reasons.
// This is convenient, since we can use that differentiate between the Instagram website and PWA.
// We set the window name so we can keep track of the page and know that it came from the PWA.

if (unsafeWindow.location.pathname === "/" && window.location.search === "?utm_source=pwa_homescreen") {
	isPWA = true;
	unsafeWindow.name = PROJECT_NAME;

	// Redirect to the DM page if not already there.
	if (!window.location.pathname.startsWith("/direct/")) {
		unsafeWindow.history.replaceState({}, "", "/direct/t/?utm_source=pwa_homescreen");
		unsafeWindow.location = "/direct/t/?utm_source=pwa_homescreen";
	}
}

if (unsafeWindow.name === PROJECT_NAME) {
	isPWA = true;
}

/**
 * Declares a feature.
 *
 * @param name The feature name.
 * @param dependencies The modules that the feature depends on.
 * @param callback The callback function to run when the feature's dependencies are loaded.
 */
function feature(name: string, dependencies: string[], callback: (...args: any[]) => Promise<unknown>) {
	if (!isPWA) return;
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
