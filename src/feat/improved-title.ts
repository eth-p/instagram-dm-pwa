// -----------------------------------------------------------------------------
// Hook: improved-title
//
// This hook patches Instagram's title to contain the name of the current
// chat thread and remove the second "Instagram" from the title.
// -----------------------------------------------------------------------------
import type * as PolarissetPageTitle from "IG_PolarissetPageTitle";
import type * as PolarisDirectThreadViewHeader_dot_react from "IG_PolarisDirectThreadViewHeader.react";

import { tryReexport, LoadManager } from "../modules";
import { ComponentProps } from "react";

const REGEX_NOTIFICATION_COUNT = /\((\d+)\)/;
const manager = new LoadManager("improved-title");

let currentThread = "";

// Override the chat thread header to steal the title.
tryReexport<typeof PolarissetPageTitle>
(manager, "IG_PolarisDirectThreadViewHeader.react", (old) => {
	return (props: ComponentProps<PolarisDirectThreadViewHeader_dot_react["default"]>) => {
		currentThread = props.title;
		return old.default(props);
	};
});

// Override the setPageTitle function to replace it with our title.
tryReexport<typeof PolarissetPageTitle>
(manager, "PolarissetPageTitle", (old) => {
	return (title: string) => {
		const notifications = REGEX_NOTIFICATION_COUNT.exec(title);

		let newTitle = [
			currentThread,
			notifications == null ? null : `(${notifications[1]})`
		];

		old.default(newTitle.filter(p => p != null && p !== "").join(" "));
	};
});
