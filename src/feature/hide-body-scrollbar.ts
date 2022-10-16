// -----------------------------------------------------------------------------
// Feature: hide-body-scrollbar
//
// This feature patches Instagram to hide the extraneous vertical scrollbar on
// the page body.
// -----------------------------------------------------------------------------

import { stylesheet } from "../util/css";

stylesheet(`
	body,
    html {
        overflow-y: hidden !important;
	}
`);

document.documentElement.style.setProperty(
	"overflow-y",
	"hidden",
	"important"
);
