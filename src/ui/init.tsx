import React from "react";
import type * as ReactDOM from "react-dom";

import Main from "./Main";
import { LoadManager, tryModules } from "../modules";

const root = document.createElement("div");
const renderRoot = root.attachShadow({mode: "closed"});
document.body.appendChild(root);

const manager = new LoadManager("ui");
tryModules<[typeof ReactDOM]>
(manager, ["react-dom"], (ReactDOM) => {
	ReactDOM.render(<Main/>, renderRoot);
})
