import { boolean } from "@storybook/addon-knobs";
import React from "react";

import { MultiSignatureDetail } from "./MultiSignatureDetail";

export default { title: "Domains / Transaction / Components / MultiSignatureDetail" };

export const Default = () => (
	<MultiSignatureDetail
		isOpen={boolean("Is Open", true)}
		onClose={() => alert("closed")}
		onCancel={() => alert("cancelled")}
	/>
);