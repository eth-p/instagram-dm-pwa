// -----------------------------------------------------------------------------
// Hook: open-instagram-externally
//
// This hook patches the `FastLink` react prop (which is used for internal
// navigation) to open non-DM Instagram links in a new tab, preventing the page
// from leaving the Instagram DM view.
// -----------------------------------------------------------------------------
import type { ComponentProps } from "react";

import type * as FastLink from "IG_FastLink";

import { tryReexport } from "../modules";

tryReexport<typeof FastLink>("FastLink", (old) => {
	return (props: ComponentProps<typeof FastLink.default>) => {
		if (props.href != null && !props.href.startsWith("/direct/")) {
			props.target = "_blank";
		}

		return old.default({
			...props,
		});
	};
});
