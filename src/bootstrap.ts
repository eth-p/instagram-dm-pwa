import { logError, logInfo } from "./util/debug";
import { require } from "./util/module";

/**
 * Declares a feature.
 *
 * @param name The feature name.
 * @param dependencies The modules that the feature depends on.
 * @param callback The callback function to run when the feature's dependencies are loaded.
 */
function feature(name: string, dependencies: string[], callback: (...args: any[]) => Promise<unknown>) {
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
