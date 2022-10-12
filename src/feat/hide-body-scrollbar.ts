// -----------------------------------------------------------------------------
// Hook: hide-body-scrollbar
//
// This hook patches Instagram to hide the extraneous scollbar on the body.
// -----------------------------------------------------------------------------
import { stylesheet } from "../stylish";

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
