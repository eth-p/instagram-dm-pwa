declare module "IG_browserHistory" {
	export const browserHistory: {
		action: "POP" | unknown;
		go: (url: string) => void;
		goBack: () => void;
		listen: () => unknown;
		location: typeof Window.location;
		push: (url: string, b?: unknown) => unknown;
		replace: (url: string, b?: unknown) => unknown;
		replaceWithCurrentRouterState: (a: unknown, b: unknown) => unknown;
	};

	/**
	 * Redirects the user.
	 *
	 * If this is an external URL, it will send the user to a tracking redirect.
	 * @param url The URL.
	 */
	export function redirect(url: string): unknown;

	export function canGoBack(): boolean;
	export function fullLoad(a: unknown): unknown;
	export function getPath(a: unknown): unknown;
	export function getQuery(a: unknown): unknown;
	export function getURL(a: unknown): unknown;
	export function isRedirectLoop(a: unknown): unknown;
	export function isReelsPage(a: unknown): unknown;
	export function isShoppingSERP(a: unknown): unknown;
	export function mergeQueryIntoPersistentParams(a: unknown, b: unknown): unknown;
	export function notifyListeners(a: unknown, b: unknown): unknown;
	export function preloadStoryRouteDefinition(a: unknown): unknown;
	export function setCometCurrentRoute(a: unknown): unknown;
	export function setCometRouterDispatcher(a: unknown): unknown;
}
