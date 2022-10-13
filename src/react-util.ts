import * as CometRouteRootWrapper_dot_react from "IG_CometRouteRootWrapper.react";
import { ComponentProps, useState } from "react";

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
