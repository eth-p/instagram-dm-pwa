// -----------------------------------------------------------------------------
// Hook: open-instagram-externally
//
// This hook patches the `FastLink` react prop (which is used for internal
// navigation) to open non-DM Instagram links in a new tab, preventing the page
// from leaving the Instagram DM view.
// -----------------------------------------------------------------------------
import { ComponentProps } from "react";

import * as FastLink from "IG_FastLink";

import { reexport } from "../interceptor";

reexport("FastLink", FastLink, (old) => {
	return (props: ComponentProps<typeof FastLink.default>) => {
		if (props.href != null && !props.href.startsWith("/direct/")) {
			props.target = "_blank";
		}

		return old.default({
			...props,
		});
	};
});
