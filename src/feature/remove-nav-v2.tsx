// -----------------------------------------------------------------------------
// Feature: remove-nav-v2
//
// This feature removes the navigation sidebar from the new version of the
// Instagram website.
// -----------------------------------------------------------------------------

import type { ComponentProps } from "react";
import * as React from "react";

import PolarisNavigation from "IG_PolarisNavigation.react";

import { reexport } from "../util/module";
import { stylesheet } from "../util/css";

// Replace the navigation component with one that doesn't render anything.
reexport(PolarisNavigation, (_old) => {
	return (_props: ComponentProps<typeof PolarisNavigation>) => {
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
