import React from "react";

const Style: React.CSSProperties = {
	position: "fixed",
	top: 0,
	left: 0,
	zIndex: Number.MAX_VALUE,
};

export default function Main(props: {}) {
	return (
		<>
			<div style={Style}>Settings</div>
		</>
	);
}
