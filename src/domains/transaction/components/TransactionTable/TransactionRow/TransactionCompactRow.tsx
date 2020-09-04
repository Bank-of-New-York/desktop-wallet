import { ExtendedTransactionData } from "@arkecosystem/platform-sdk-profiles";
import React from "react";

import { TransactionRowAmount } from "./TransactionRowAmount";
import { TransactionRowMode } from "./TransactionRowMode";
import { TransactionRowRecipientLabel } from "./TransactionRowRecipientLabel";

type Props = {
	transaction: ExtendedTransactionData;
	walletName?: string;
} & React.HTMLProps<any>;

export const TransactionCompactRow = ({ transaction, walletName, ...props }: Props) => (
	<tr
		data-testid="TransactionCompactRow"
		className="border-b border-dotted cursor-pointer border-theme-neutral-300 bg-opacity-10 hover:bg-theme-neutral-100"
		{...props}
	>
		<td className="w-24 py-3">
			<TransactionRowMode transaction={transaction} />
		</td>
		<td>
			<TransactionRowRecipientLabel transaction={transaction} walletName={walletName} />
		</td>
		<td className="text-right">
			<TransactionRowAmount transaction={transaction} />
		</td>
	</tr>
);