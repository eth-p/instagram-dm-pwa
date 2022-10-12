// -----------------------------------------------------------------------------
// Hook: hide-instagram-nav
//
// This hook patches Instagram to remove the navigation pane.
// -----------------------------------------------------------------------------
import type { ComponentProps } from "react";
import * as React from "react";

import type * as PolarisNavigation_dot_React from "IG_PolarisNavigation.react";

import { tryModules, reexport } from "../modules";
import { stylesheet } from "../stylish";

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
		}
	`);
});
