// -----------------------------------------------------------------------------
// Hook: remove-nav-v2
//
// This feature removes the navigation sidebar from the new version of the
// Instagram website.
// -----------------------------------------------------------------------------
import type { ComponentProps } from "react";
import * as React from "react";

import type * as PolarisNavigation_dot_React from "IG_PolarisNavigation.react";

import { tryModules, reexport, LoadManager } from "../modules";
import { stylesheet } from "../stylish";

const manager = new LoadManager("remove-nav-v2");
const target = "PolarisNavigation.react";
tryModules(manager, [target], mod => {

	// Replace the navigation component with one that doesn't render anything.
	reexport(target, mod, (_old) => {
		return (_props: ComponentProps<typeof PolarisNavigation_dot_React.default>) => {
			return <></>;
		};
	});
	
	// Update the styles to remove the extra padding for the nav.
	stylesheet(`
		body {
			--nav-medium-width: 0px;
			--nav-narrow-width: 0px;
			--nav-wide-width: 0px;
		}
	`);

});
