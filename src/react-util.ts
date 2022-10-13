import * as CometRouteRootWrapper_dot_react from "IG_CometRouteRootWrapper.react";
import type { ComponentProps, ReactElement } from "react";
import { useState } from "react";

import { reexport } from "./modules";

let hooks: (() => void)[] = [];
let refresh: {do: () => void} = {do: () => {}};

// Hook a component somewhere in the program hierarchy.
reexport("CometRouteRootWrapper.react", CometRouteRootWrapper_dot_react, (old) => {
	return (props: ComponentProps<typeof CometRouteRootWrapper_dot_react.default>) => {
		const [counter, setCounter] = useState(0);
		refresh.do = () => {
			setCounter(counter + 1);
		}

		// Run the hooks.
		for (const hook of hooks) {
			hook();
		}

		// Render the real component.
		return old.default(props);
	};
});

/**
 * Allows React hooks to be used.
 * 
 * This injects the hooks into a VERY high-up object in the virtual DOM.
 * DO NOT ABUSE IT.
 * 
 * @param fn The function containing hooks.
 */
export function useHooks(fn: () => void) {
	hooks.push(fn);
	refresh.do();
}

export type ReactElementVisitor = (element: ReactElement, descend: (element: ReactElement) => ReactElement|null) => ReactElement | null;

/**
 * Recursively visit the children of a node.
 * 
 * @param root The root node.
 * @param visitor The visitor function.
 * 
 * @returns The root node.
 */
export function visit(root: ReactElement, visitor: ReactElementVisitor): ReactElement {
	if (typeof root !== 'object' || root.props.children == null) {
		return root;
	}

	// Bind the visit function to reuse the same visitor.
	const boundVisit = (root: ReactElement) => visit(root, visitor);

	// Iterate through the children if it's an array.
	const children = root.props.children;
	if (children instanceof Array) {
		for (const [i, child] of children.entries()) {
			children[i] = visitor(child, boundVisit);
		}

		return root;
	}

	// Single child.
	if (typeof children === 'object') {
		root.props.children = visitor(root.props.children, boundVisit);
	}
	
	return root;
}
