declare module "IG_PolarisIGCoreBox" {
	export default function PolarisIGCoreBox(props?: {
		children?: React.ReactNode;

		// Style?
		border?: boolean;
		shape?: "square" | unknown;
		color?: "transparent" | unknown;

		// Layout?
		alignContent?: "stretch" | unknown;
		alignItems?: "stretch" | unknown;
		alignSelf?: "auto" | unknown;
		direction?: "row" | unknown;
		display?: "flex" | unknown;
		flex?: "grow" | unknown;
		justifyContent?: "start" | unknown;
		overflow?: "visible" | unknown;
		position?: "static" | unknown;
		wrap?: boolean;

		maxWidth?: number;
		width?: string;
		height?: string;
		margin?: number;
		padding?: number;

		bottom?: boolean;
		left?: boolean;
		right?: boolean;
		top?: boolean;
	}): React.ReactElement;
}
