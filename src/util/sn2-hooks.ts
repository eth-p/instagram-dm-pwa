import type { ComponentProps, ReactElement } from "react";

import type IG_CometRouteRootWrapper from "IG_CometRouteRootWrapper.react";
import type IG_React from "react";

import { guardAsync } from "./guard";
import { require, reexport } from "./module";

let hooks: (() => void)[] = [];
let refresh: {do: () => void} = {do: () => {}};

// Hook a component somewhere in the program hierarchy.
guardAsync("react-util hooks", async () => {
	const [React, CometRouteRootWrapper] = await require<[typeof IG_React, typeof IG_CometRouteRootWrapper]>(["react", "CometRouteRootWrapper.react"]);
	reexport(CometRouteRootWrapper, (old) => {
		return (props: ComponentProps<typeof CometRouteRootWrapper>) => {
			const [counter, setCounter] = React.useState(0);
			refresh.do = () => {
				setCounter(counter + 1);
			}

			// Run the hooks.
			for (const hook of hooks) {
				hook();
			}

			// Render the real component.
			return old(props);
		};
	});
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
