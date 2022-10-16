/**
 * Inject a stylesheet into the page.
 *
 * @param styles The styles to inject.
 */
export function stylesheet(styles: string) {
	const element = document.createElement("style");
	element.textContent = styles;
	document.head.appendChild(element);
}
