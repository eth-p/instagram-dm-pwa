/**
 * Inject a stylesheet into the page.
 *
 * @param styles The styles to inject.
 */
export function stylesheet(styles: string) {
	const element = document.createElement("style");
	element.innerHTML = styles;
	document.head.appendChild(element);
}
