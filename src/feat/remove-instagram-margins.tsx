// -----------------------------------------------------------------------------
// Hook: remove-instagram-margins
//
// This hook patches the DM page to remove the extra margins around it.
// -----------------------------------------------------------------------------
import type { ComponentProps } from "react";

import type * as PolarisDesktopDirectPage from "IG_PolarisDesktopDirectPage.react";
import type PolarisIGCoreBox from "IG_PolarisIGCoreBox";

import { tryModules, reexport } from "../modules";
import { visit } from "../react-util";

tryModules<[typeof PolarisDesktopDirectPage, typeof PolarisIGCoreBox]>
(["PolarisDesktopDirectPage.react", "PolarisIGCoreBox"], (PolarisDesktopDirectPage, PolarisIGCoreBox) => {
	reexport("PolarisDesktopDirectPage.react", PolarisDesktopDirectPage, (old) => {
		return (props: ComponentProps<typeof PolarisDesktopDirectPage.default>) => {
			const root = old.default(props);
	
			// Remove the margins.
			root.props.style = {padding: 0};
	
			// Disable the border and max width of the IGCoreBox.
			return visit(root, (element, visit) => {
				if (element.type === PolarisIGCoreBox) {
					element.props.border = false;
					delete element.props.maxWidth;
					return element;
				}

				return visit(element);
			});
			
		};
	});
})
