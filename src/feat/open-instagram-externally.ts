// -----------------------------------------------------------------------------
// Hook: open-instagram-externally
//
// This hook patches the `FastLink` react prop (which is used for internal
// navigation) to open non-DM Instagram links in a new tab, preventing the page
// from leaving the Instagram DM view.
// -----------------------------------------------------------------------------
import type { ComponentProps } from "react";

import type * as FastLink from "IG_FastLink";
import type * as browserHistory from "IG_browserHistory";

import { intercept, tryModules, tryReexport, wrap } from "../modules";

/**
 * Checks if a URL should open externally.
 * @param url The URL.
 */
function shouldOpenExternally(url: string): boolean {
	return url != null && !url.startsWith("/direct/");
}

/**
 * Opens a URL if it should be opened externally.
 * If the URL should be opened internally, will return false.
 *
 * @param url The URL.
 */
function tryOpenExternally(url: string): boolean {
	if (shouldOpenExternally(url)) {
		window.open(url, "_blank");
		return true;
	}

	return false;
}

tryReexport<typeof FastLink>("FastLink", (old) => {
	return (props: ComponentProps<typeof FastLink.default>) => {
		if (shouldOpenExternally(props.href)) {
			props.target = "_blank";
		}

		return old.default({
			...props,
		});
	};
});

tryModules<[typeof browserHistory]>
(["browserHistory"], (browserHistory) => {

	intercept(browserHistory, "redirect", (thisValue, original, args) => {
		if (!tryOpenExternally(args[0])) {
			return original.apply(thisValue, args);
		}
	});

	browserHistory.browserHistory.go = wrap(browserHistory.browserHistory.go, (thisValue, original, args) => {
		if (!tryOpenExternally(args[0] /* url */)) {
			return original.apply(thisValue, args);
		}
	});

	browserHistory.browserHistory.push = wrap(browserHistory.browserHistory.push, (thisValue, original, args) => {
		if (!tryOpenExternally(args[0] /* url */)) {
			return original.apply(thisValue, args);
		}
	});

	browserHistory.browserHistory.replace = wrap(browserHistory.browserHistory.replace, (thisValue, original, args) => {
		if (!tryOpenExternally(args[0] /* url */)) {
			return original.apply(thisValue, args);
		}
	});

});
