// -----------------------------------------------------------------------------
// Hook: remove-instagram-margins
//
// This hook patches the DM page to remove the extra margins around it.
// -----------------------------------------------------------------------------
import type { ComponentProps } from "react";

import * as PolarisDesktopDirectPage from "IG_PolarisDesktopDirectPage.react";
import PolarisIGCoreBox from "IG_PolarisIGCoreBox";

import { reexport } from "../interceptor";

reexport("PolarisDesktopDirectPage.react", PolarisDesktopDirectPage, (old) => {
	return (props: ComponentProps<typeof PolarisDesktopDirectPage.default>) => {
		const root = old.default(props);

		// Find the first IGCoreBox.
		// This will have a max width specified.
		let child = root;
		while (child != null && child.type !== PolarisIGCoreBox) {
			child = child.props.children;
		}

		// Remove the max width and border.
		if (child != null && child.props != null) {
			const childProps = (child.props as ComponentProps<typeof PolarisIGCoreBox>)!;
			delete childProps.maxWidth;
			childProps.border = false;
		}

		// Remove the margins.
		// root.props.className = "";
		root.props.style = {padding: 0};

		// Return the child nodes.
		return root;
	};
});
