// -----------------------------------------------------------------------------
// Feature: improved-title
//
// This feature patches Instagram's title to contain the name of the current
// chat thread and remove the second "Instagram" from the PWA title.
// -----------------------------------------------------------------------------

import type { ComponentProps } from "react";

import PolarissetPageTitle from "IG_PolarissetPageTitle";
import PolarisDirectThreadViewHeader_dot_react from "IG_PolarisDirectThreadViewHeader.react";

import { reexport } from "../util/module";

const REGEX_NOTIFICATION_COUNT = /\((\d+)\)/;
let currentThread = "";

// Override the chat thread header to steal the title.
reexport(PolarisDirectThreadViewHeader_dot_react, old => {
	return (props: ComponentProps<typeof PolarisDirectThreadViewHeader_dot_react>) => {
		currentThread = props.title;
		return old(props);
	};
});

// Override the setPageTitle function to replace it with our title.
reexport(PolarissetPageTitle, old => {
	return (title: string) => {
		const notifications = REGEX_NOTIFICATION_COUNT.exec(title);

		let newTitle = [
			currentThread,
			notifications == null ? null : `(${notifications[1]})`,
		];

		old(newTitle.filter(p => p != null && p !== "").join(" "));
	};
});
