declare module "IG_PolarisIGTheme.react" {

	/**
	 * An enum of supported theme types.
	 */
	export enum IGTheme {
		Light = "light",
		Dark = "dark"
	};

	/**
	 * Returns true if Instagram is using the dark theme.
	 */
	export const isDarkMode: () => boolean;

	/**
	 * A React hook for using the theme in a functional component.
	 */
	export const useTheme: () => unknown;

	/**
	 * A React hook for using the theme in a functional component.
	 */
	export const useThemeColor: (a: unknown) => unknown;

	// Unknown

	export const IGThemeConsumer: React.Context<unknown>;
	export const IGThemeContext: React.Context<unknown>;
	export const IGThemeProvider: (a: unknown) => unknown;

}
