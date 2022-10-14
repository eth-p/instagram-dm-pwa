// -----------------------------------------------------------------------------
// Hook: remove-nav-v1
//
// This feature removes the navigation header from the old version of the
// Instagram website.
// -----------------------------------------------------------------------------
import type { ComponentProps } from "react";
import * as React from "react";

import type * as PolarisDesktopNav_dot_react from "IG_PolarisDesktopNav.react";

import { tryModules, reexport, LoadManager } from "../modules";
import { createRef, useEffect } from "react";

const manager = new LoadManager("remove-nav-v1");
const target = "PolarisDesktopNav.react";
tryModules(manager, [target], mod => {
	reexport(target, mod, (_old) => {
		return (_props: ComponentProps<typeof PolarisDesktopNav_dot_react.default>) => {

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
});
