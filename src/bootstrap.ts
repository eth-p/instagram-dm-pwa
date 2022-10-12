declare interface Window {
	define: (name: string, deps: string[], callback: Function) => unknown;
	requireLazy: (deps: string[], callback: Function) => unknown;

	logMsg: (format: string, ...args: any[]) => void;
	logErr: (format: string, ...args: any[]) => void;
}

function bootstrap(main: (define: (deps: string[], callback: Function) => void) => void) {
	"use strict";

	const PROJECT_NAME = "instagram-dm-pwa";
	const LOOKUP_INTERVAL   = 10;
	const LOOKUP_TIME_LIMIT = 10000;

	// Only act on the PWA.
	//
	// The PWA entrypoint is set to "/?utm_source=pwa_homescreen" for tracking reasons.
	// This is convenient, since we can use that differentiate between the Instagram website and PWA.
	// We set the window name so we can keep track of the page and know that it came from the PWA.

    if (unsafeWindow.location.pathname === "/" && window.location.search === "?utm_source=pwa_homescreen") {
        unsafeWindow.name = PROJECT_NAME;
        unsafeWindow.history.replaceState({}, "", "/direct/t/?utm_source=pwa_homescreen");
        unsafeWindow.location = "/direct/t/?utm_source=pwa_homescreen";
        return;
    }

    if (window.name !== PROJECT_NAME) {
        return;
    }


	// Logging utils.

	window.logMsg = (format: string, ...args: any[]) => {
		console.log("%c[%s]%c " + format, "color: #0c3", PROJECT_NAME, "color: unset", ...args);
	}

	window.logErr = (format: string, ...args: any[]) => {
		console.error("%c[%s]%c " + format, "color: #c30", PROJECT_NAME, "color: unset", ...args);
	}


	// Try to get Instagram's `define` function.
	// We'll be using this to inject our own code.
	// Note: Using timeouts since setInterval has some bugs.

	const start = Date.now();
	function tryToGetDefine() {
		if ('define' in unsafeWindow) {
			window.logMsg("Bootstrap starting.");
			return main(defineShim);
		}

		if (Date.now() > (start + LOOKUP_TIME_LIMIT)) {
			alert("Unable to bootstrap Instagram DM PWA.");
			return;
		}

		setTimeout(tryToGetDefine, LOOKUP_INTERVAL);
	}

	// A shim that makes Instagram's (probably proprietary) module loader
	// work correctly with rollup's AMD modules. We also need to force a
	// lazy load on the module to have it actually start loading.
	function defineShim(deps: string[], callback: Function) {
		const nsprefix = /^IG_/;
		unsafeWindow.requireLazy(deps.map(d => d.replace(nsprefix, "")), (...args: any[]) => {
			try {
				return callback(...args);
			} catch (ex) {
				window.logErr("Unexpected error.", ex);
				throw ex;
			}
		});
	}

	// Start.
	tryToGetDefine();
}
