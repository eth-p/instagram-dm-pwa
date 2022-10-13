// -----------------------------------------------------------------------------
// Hook: hide-instagram-nav
//
// This hook patches Instagram to remove the navigation pane.
// -----------------------------------------------------------------------------
import type { ComponentProps } from "react";
import * as React from "react";

import type * as PolarisNavigation_dot_React from "IG_PolarisNavigation.react";
import type * as PolarisDesktopNav_dot_react from "IG_PolarisDesktopNav.react";

import { tryModules, reexport } from "../modules";
import { stylesheet } from "../stylish";
import { createRef, useEffect, useRef } from "react";

// New Site
const target = "PolarisNavigation.react";
tryModules([target], mod => {
	reexport(target, mod, (old) => {
		return (props: ComponentProps<typeof PolarisNavigation_dot_React.default>) => {
			return <></>;
		};
	});
	
	stylesheet(`
		body {
			--nav-medium-width: 0px;
			--nav-narrow-width: 0px;
			--nav-wide-width: 0px;
		}
	`);
});

// Old Site
const targetOld = "PolarisDesktopNav.react";
tryModules([targetOld], mod => {
	reexport(targetOld, mod, (old) => {
		return (props: ComponentProps<typeof PolarisDesktopNav_dot_react.default>) => {
			const ref = createRef<HTMLDivElement>();
			useEffect(() => {
				if (ref.current != null) {
					ref.current.parentElement!.style.paddingTop = "0px";
				}
			}, [ref]);

			return <div ref={ref}></div>;
		};
	});

	stylesheet(`
		body {
			--nav-medium-width: 0px;
			--nav-narrow-width: 0px;
		}
	`);
});
