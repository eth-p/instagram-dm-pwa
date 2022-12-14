// -----------------------------------------------------------------------------
// Feature: style-dark-mode
//
// This feature unlocks and automatically enables the built-in dark mode theme
// provided by instagram.
// -----------------------------------------------------------------------------

import { useContext, useState } from "react";

import PolarisDarkModeQEUtils from "IG_PolarisDarkModeQEUtils";
import PolarisIGTheme from "IG_PolarisIGTheme.react";

import { intercept } from "../util/module";
import { useHooks } from "../util/sn2-hooks";

const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)");

// Override the real check to whatever the user prefers.
intercept(PolarisIGTheme, "isDarkMode", (_thisArg, _original, _args) => {
	return isSystemDark.matches;
});

// Unconditionally enable dark mode support.
// As of 2022-10-11, it appears to be a feature test and is not universally enabled.
intercept(PolarisDarkModeQEUtils, "hasDarkModeToggleEnabled", (_thisArg, _original, _args) => {
	return true;
});

// Within the context of the React app, update the theme.
// Also listen for color scheme changes and update dynamically.
useHooks(() => {
	const ctx = useContext(PolarisIGTheme.IGThemeContext) as any;

	function onSystemColorSchemeChange() {
		ctx.setTheme(isSystemDark.matches ? PolarisIGTheme.IGTheme.Dark : PolarisIGTheme.IGTheme.Light);
	}

	useState(() => {
		isSystemDark.addEventListener("change", onSystemColorSchemeChange);
		onSystemColorSchemeChange();

		return () => {
			isSystemDark.removeEventListener("change", onSystemColorSchemeChange);
		};
	});
});

// Listen for the theme to change.
// When it changes, update the <meta name="theme-color"> tag.
const styleObserver = new MutationObserver((_mutations) => {
	const style = window.getComputedStyle(document.body);
	const background = (() => {
		const varBg = style.getPropertyValue("--instagram-background");
		if (varBg) return `rgb(${varBg})`;
		return style.backgroundColor;
	})();

	const meta = document.querySelector("meta[name=\"theme-color\"]");
	meta?.setAttribute("content", background);
});

styleObserver.observe(document.documentElement, {
	attributes: true,
	attributeFilter: ["class"],
});
