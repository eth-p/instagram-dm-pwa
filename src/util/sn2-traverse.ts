import type { ReactElement } from "react";

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
