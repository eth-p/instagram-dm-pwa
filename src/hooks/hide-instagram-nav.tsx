// -----------------------------------------------------------------------------
// Hook: hide-instagram-nav
//
// This hook patches Instagram to remove the navigation pane.
// -----------------------------------------------------------------------------
import type { ComponentProps } from "react";
import * as React from "react";

import * as PolarisNavigation_dot_React from "IG_PolarisNavigation.react";

import { reexport } from "../interceptor";
import { stylesheet } from "../stylish";

reexport("PolarisNavigation.react", PolarisNavigation_dot_React, (old) => {
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
