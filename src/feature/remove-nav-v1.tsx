// -----------------------------------------------------------------------------
// Feature: remove-nav-v1
//
// This feature removes the navigation header from the old version of the
// Instagram website.
// -----------------------------------------------------------------------------

import type { ComponentProps } from "react";
import * as React from "react";
import { createRef, useEffect } from "react";

import PolarisDesktopNav from "IG_PolarisDesktopNav.react";

import { reexport } from "../util/module";

reexport(PolarisDesktopNav, (_old) => {
	return (_props: ComponentProps<typeof PolarisDesktopNav>) => {

		// Create a ref and use that to remove the padding of the parent element.
		const ref = createRef<HTMLDivElement>();
		useEffect(() => {
			if (ref.current != null) {
				ref.current.parentElement!.style.paddingTop = "0px";
			}
		}, [ref]);

		// Return an empty div to remove the nav.
		return <div ref={ref}></div>;

	};
});
