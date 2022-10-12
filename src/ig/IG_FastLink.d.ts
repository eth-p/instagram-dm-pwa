declare module "IG_FastLink" {
	export default function FastLink(props: {
		href: string;
		target?: HTMLAnchorElement["target"];

		// Unknown
		canTabFocus?: bool;
		className?: string;
		display?: unknown;
		ref?: React.Ref<unknown>;
		linkRef?: unknown;
		onClick?: React.MouseEventHandler;
		onMouseEnter?: React.MouseEventHandler;
		onMouseLeave?: React.MouseEventHandler;
		params?: unknown;
		productAttribution?: unknown;
		shouldOpenModal?: boolean;
		state?: unknown;
		style_DEPRECATED?: unknown;
	}): React.ReactElement;
}
