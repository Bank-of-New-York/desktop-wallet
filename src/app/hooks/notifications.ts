import { Environment, Profile, ReadWriteWallet } from "@arkecosystem/platform-sdk-profiles";
import { TransactionDataType } from "@arkecosystem/platform-sdk/dist/contracts";
import { useMemo } from "react";

type SyncReceivedTransactionsParams = {
	lookupLimit?: number;
	allowedTransactionTypes?: string[];
};

type NotifyReceivedTransactionsParams = SyncReceivedTransactionsParams & { profile: Profile };

const fetchRecentProfileTransactions = async (profile: Profile, limit: number) => {
	const fetchWalletRecentTransactions = async (wallet: ReadWriteWallet) =>
		(await wallet.client().transactions({ limit })).items();

	const allWalletTransactions = await Promise.all(profile.wallets().values().map(fetchWalletRecentTransactions));
	return allWalletTransactions.flat();
};

const isRecipient = (profile: Profile, transaction: TransactionDataType) => {
	const allRecipients = [transaction.recipient(), ...transaction.recipients().map((r) => r.address)];
	return allRecipients.some((address: string) => profile.wallets().findByAddress(address));
};

const transactionNotificationExists = (profile: Profile, transaction: TransactionDataType) =>
	profile
		.notifications()
		.values()
		.some((n) => n.type === "transaction" && n?.meta?.transactionId === transaction.id());

const formatNotification = (transaction: TransactionDataType) => ({
	icon: "",
	body: "",
	name: "",
	action: "",
	type: "transaction",
	meta: {
		transactionId: transaction.id(),
		walletAddress: transaction.recipient(),
	},
});

const filterUnseenTransactions = (
	profile: Profile,
	transactions: TransactionDataType[],
	allowedTransactionTypes: string[],
) =>
	transactions.reduce((addedTransactions: TransactionDataType[], transaction: TransactionDataType) => {
		if (
			allowedTransactionTypes.includes(transaction.type()) &&
			isRecipient(profile, transaction) &&
			!transactionNotificationExists(profile, transaction) &&
			!addedTransactions.find((t) => t.id() === transaction.id())
		)
			addedTransactions.push(transaction);
		return addedTransactions;
	}, []);

const notifyReceivedTransactions: any = async ({
	profile,
	lookupLimit = 20,
	allowedTransactionTypes = ["transfer", "multiPayment"],
}: NotifyReceivedTransactionsParams) => {
	const allRecentTransactions = await fetchRecentProfileTransactions(profile, lookupLimit);
	const newUnseenTransactions = filterUnseenTransactions(profile, allRecentTransactions, allowedTransactionTypes);

	return newUnseenTransactions.map((transaction: TransactionDataType) =>
		profile.notifications().push(formatNotification(transaction)),
	);
};

export const useNotifications = (env: Environment) => {
	const profiles = env.profiles();

	return useMemo(() => {
		const syncReceivedTransactions = async (params?: SyncReceivedTransactionsParams) => {
			const savedNotifications = await Promise.all(
				profiles.values().map((profile: Profile) => notifyReceivedTransactions({ ...params, profile })),
			);

			await env.persist();
			return savedNotifications.flat();
		};

		return {
			notifications: {
				syncReceivedTransactions,
			},
		};
	}, [profiles, env]);
};
