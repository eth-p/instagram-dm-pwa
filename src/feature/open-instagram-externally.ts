// -----------------------------------------------------------------------------
// Feature: open-instagram-externally
//
// This feature patches the `FastLink` react prop (which is used for internal
// navigation) to open non-DM Instagram links in a new tab, preventing the page
// from leaving the Instagram DM view.
// -----------------------------------------------------------------------------

import type { ComponentProps } from "react";

import FastLink from "IG_FastLink";

import { intercept, reexport, wrap } from "../util/module";
import { guardAsync } from "../util/guard";

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


reexport(FastLink, (old) => {
	return (props: ComponentProps<typeof FastLink>) => {
		if (shouldOpenExternally(props.href)) {
			props.target = "_blank";
		}

		return old({
			...props,
		});
	};
});

guardAsync("browserHistory hook", async () => {
	const browserHistory = await import("IG_browserHistory");

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
