import { ReadWriteWallet } from "@arkecosystem/platform-sdk-profiles";
import { Table } from "app/components/Table";
import React from "react";
import { useTranslation } from "react-i18next";

import { DelegateRowItem } from "./DelegateRowItem";

type Props = {
	wallets: ReadWriteWallet[];
	onAction?: any;
};

type DelegateRowItem = {
	wallet: ReadWriteWallet;
	onAction?: any;
};

export const DelegateTable = ({ wallets, onAction }: Props) => {
	const { t } = useTranslation();

	const columns = [
		{
			Header: t("PROFILE.PAGE_MY_REGISTRATIONS.DELEGATE_NAME"),
			className: "ml-25",
		},
		{
			Header: t("PROFILE.PAGE_MY_REGISTRATIONS.RANK"),
			className: "justify-end",
		},
		{
			Header: t("PROFILE.PAGE_MY_REGISTRATIONS.MSQ"),
			className: "justify-center",
		},
		{
			Header: t("PROFILE.PAGE_MY_REGISTRATIONS.STATUS"),
			className: "justify-center",
		},
		{
			Header: t("PROFILE.PAGE_MY_REGISTRATIONS.FORGED_AMOUNT"),
			className: "justify-end",
		},
		{
			Header: t("PROFILE.PAGE_MY_REGISTRATIONS.VOTES"),
			className: "justify-end no-border",
		},
		{
			Header: "Actions",
			className: "hidden",
		},
	];

	return (
		<>
			<h2 className="mb-8 font-bold">{t("PROFILE.PAGE_MY_REGISTRATIONS.DELEGATE")}</h2>

			<Table columns={columns} data={wallets}>
				{(wallet: ReadWriteWallet) => <DelegateRowItem wallet={wallet} onAction={onAction} />}
			</Table>
		</>
	);
};
