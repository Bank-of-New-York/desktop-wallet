import { Profile } from "@arkecosystem/platform-sdk-profiles";
import { waitFor } from "@testing-library/react";
import nock from "nock";
import React from "react";
import { act } from "react-dom/test-utils";
import { env, fireEvent, getDefaultProfileId, render } from "testing-library";
const NotificationTransactionsFixtures = require("tests/fixtures/coins/ark/notification-transactions.json");

import { markAsRead, Notifications } from "./";

let profile: Profile;

describe("Notifications", () => {
	beforeEach(() => {
		nock("https://dwallets.ark.io")
			.post("/api/transactions/search")
			.query(true)
			.reply(200, NotificationTransactionsFixtures);

		profile = env.profiles().findById(getDefaultProfileId());
		profile.transactionAggregate().flush();
	});

	it("should render with plugins", async () => {
		const { container, queryAllByTestId } = render(<Notifications profile={profile} />);
		await waitFor(() => expect(queryAllByTestId("TransactionRowMode")).not.toHaveLength(0));

		expect(container).toMatchSnapshot();
	});

	it("should render with transactions and plugins", async () => {
		const { container, getAllByTestId, queryAllByTestId } = render(<Notifications profile={profile} />);

		await waitFor(() => expect(getAllByTestId("NotificationItem")).toHaveLength(2));
		await waitFor(() => expect(queryAllByTestId("TransactionRowMode").length).toBeGreaterThan(0));

		expect(container).toMatchSnapshot();
	});

	it("should emit onNotificationAction event", async () => {
		const onNotificationAction = jest.fn();

		const { getAllByTestId, queryAllByTestId } = render(
			<Notifications profile={profile} onNotificationAction={onNotificationAction} />,
		);
		await waitFor(() => expect(getAllByTestId("NotificationItem")).toHaveLength(2));
		await waitFor(() => expect(queryAllByTestId("TransactionRowMode").length).toBeGreaterThan(0));

		act(() => {
			fireEvent.click(getAllByTestId("NotificationItem__action")[1]);
		});

		await waitFor(() => expect(onNotificationAction).toHaveBeenCalled());
	});

	it("should emit transactionClick event", async () => {
		const onTransactionClick = jest.fn();

		const all = profile.notifications().count();

		const { container, getAllByTestId, queryAllByTestId } = render(
			<Notifications profile={profile} onTransactionClick={onTransactionClick} />,
		);

		await waitFor(() => expect(getAllByTestId("NotificationItem")).toHaveLength(2));
		await waitFor(() => expect(queryAllByTestId("TransactionRowMode").length).toBeGreaterThan(0));

		act(() => {
			fireEvent.click(getAllByTestId("TransactionRowMode")[0]);
		});

		await waitFor(() => expect(onTransactionClick).toHaveBeenCalled());
		expect(container).toMatchSnapshot();
	});

	it("should mark notification as read", () => {
		const notification = profile.notifications().first();
		expect(notification.read_at).toBeUndefined();
		const isVisible = true;
		markAsRead(isVisible, notification.id, profile, env);
		expect(profile.notifications().get(notification.id).read_at).toBeTruthy();
	});

	it("should not mark notification if is already read", () => {
		const notification = profile.notifications().last();
		expect(notification.read_at).toBeUndefined();
		const isVisible = true;

		markAsRead(isVisible, notification.id, profile, env);
		const firstReadAt = profile.notifications().get(notification.id).read_at;
		expect(firstReadAt).toBeTruthy();

		markAsRead(isVisible, notification.id, profile, env);
		expect(profile.notifications().get(notification.id).read_at).toEqual(firstReadAt);
	});

	it("should render with empty notifications", async () => {
		profile.notifications().flush();
		const { container, queryAllByTestId } = render(<Notifications profile={profile} />);
		await waitFor(() => expect(queryAllByTestId("TransactionRowMode")).toHaveLength(0));
		expect(container).toMatchSnapshot();
	});
});
