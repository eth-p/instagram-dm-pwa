import * as PolarisDirectShell_dot_next from "IG_PolarisDirectShell.next";
import { ComponentProps, useState } from "react";

import { reexport } from "./interceptor";

let hooks: (() => void)[] = [];
let refresh: {do: () => void} = {do: () => {}};

// Hook a component somewhere in the program hierarchy.
reexport("IG_PolarisDirectShell.next", PolarisDirectShell_dot_next, (old) => {
	return (props: ComponentProps<typeof PolarisDirectShell_dot_next.default>) => {
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
