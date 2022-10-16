// -----------------------------------------------------------------------------
// Feature: remove-instagram-margins
//
// This feature patches the DM page to remove the extra margins around it.
// -----------------------------------------------------------------------------

import type { ComponentProps } from "react";

import PolarisDesktopDirectPage from "IG_PolarisDesktopDirectPage.react";
import PolarisIGCoreBox from "IG_PolarisIGCoreBox";

import { reexport } from "../util/module";
import { visit } from "../util/sn2-traverse";

reexport(PolarisDesktopDirectPage, (old) => {
	return (props: ComponentProps<typeof PolarisDesktopDirectPage>) => {
		const root = old(props);

		// Remove the margins.
		root.props.style = { padding: 0 };

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
