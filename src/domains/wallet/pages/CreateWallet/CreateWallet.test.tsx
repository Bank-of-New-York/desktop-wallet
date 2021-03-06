/* eslint-disable @typescript-eslint/require-await */
import { BIP39 } from "@arkecosystem/platform-sdk-crypto";
import { Profile, WalletSetting } from "@arkecosystem/platform-sdk-profiles";
import { act, renderHook } from "@testing-library/react-hooks";
import { toasts } from "app/services";
import { availableNetworksMock } from "domains/network/data";
import electron from "electron";
import { createMemoryHistory } from "history";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Route } from "react-router-dom";
import {
	act as actAsync,
	env,
	fireEvent,
	getDefaultProfileId,
	render,
	renderWithRouter,
	waitFor,
} from "utils/testing-library";

import { CreateWallet } from "./CreateWallet";
import { FirstStep } from "./Step1";
import { SecondStep } from "./Step2";
import { ThirdStep } from "./Step3";
import { FourthStep } from "./Step4";

jest.setTimeout(8000);

jest.mock("electron", () => ({
	remote: {
		dialog: {
			showSaveDialog: jest.fn(),
		},
	},
}));

let profile: Profile;
let bip39GenerateMock: any;

const passphrase = "power return attend drink piece found tragic fire liar page disease combine";

beforeAll(() => {
	bip39GenerateMock = jest.spyOn(BIP39, "generate").mockReturnValue(passphrase);
});

const fixtureProfileId = getDefaultProfileId();

afterAll(() => {
	bip39GenerateMock.mockRestore();
});

describe("CreateWallet", () => {
	beforeEach(() => {
		profile = env.profiles().findById(fixtureProfileId);

		for (const wallet of profile.wallets().values()) {
			profile.wallets().forget(wallet.id());
		}

		bip39GenerateMock = jest.spyOn(BIP39, "generate").mockReturnValue(passphrase);
	});

	afterEach(() => {
		bip39GenerateMock.mockRestore();
	});

	it("should render 1st step", async () => {
		const { result: form } = renderHook(() => useForm());
		const { getByTestId, asFragment } = render(
			<FormProvider {...form.current}>
				<FirstStep env={env} profile={profile} />
			</FormProvider>,
		);

		expect(getByTestId("CreateWallet__first-step")).toBeTruthy();
		expect(asFragment()).toMatchSnapshot();

		const selectNetworkInput = getByTestId("SelectNetworkInput__input");
		expect(selectNetworkInput).toBeTruthy();

		act(() => {
			fireEvent.change(selectNetworkInput, { target: { value: "Ark Dev" } });
		});

		act(() => {
			fireEvent.keyDown(selectNetworkInput, { key: "Enter", code: 13 });
		});

		expect(selectNetworkInput).toHaveAttribute("disabled");

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(selectNetworkInput).not.toHaveAttribute("disabled"));
	});

	describe("2nd step", () => {
		it("should render", async () => {
			const { result: form } = renderHook(() =>
				useForm({
					defaultValues: {
						mnemonic: "test mnemonic",
						wallet: {
							address: () => "address",
						},
					},
				}),
			);

			jest.spyOn(electron.remote.dialog, "showSaveDialog").mockImplementation(() => ({
				filePath: "filePath",
			}));

			const { getByTestId, asFragment } = render(
				<FormProvider {...form.current}>
					<SecondStep />
				</FormProvider>,
			);

			expect(asFragment()).toMatchSnapshot();

			const writeTextMock = jest.fn();
			const clipboardOriginal = navigator.clipboard;
			// @ts-ignore
			navigator.clipboard = { writeText: writeTextMock };

			act(() => {
				fireEvent.click(getByTestId(`CreateWallet__copy`));
			});

			await waitFor(() => expect(writeTextMock).toHaveBeenCalledWith("test mnemonic"));

			// @ts-ignore
			navigator.clipboard = clipboardOriginal;
		});

		it("should show success toast on succesfull download", async () => {
			const { result: form } = renderHook(() =>
				useForm({
					defaultValues: {
						mnemonic: "test mnemonic",
						wallet: {
							address: () => "address",
						},
					},
				}),
			);

			jest.spyOn(electron.remote.dialog, "showSaveDialog").mockImplementation(() => ({
				filePath: "filePath",
			}));

			const toastSpy = jest.spyOn(toasts, "success");

			const { getByTestId, asFragment } = render(
				<FormProvider {...form.current}>
					<SecondStep />
				</FormProvider>,
			);

			await act(async () => {
				fireEvent.click(getByTestId(`CreateWallet__download`));
			});

			expect(toastSpy).toHaveBeenCalled();
			toastSpy.mockRestore();
		});

		it("should not show success toast on cancelled download", async () => {
			const { result: form } = renderHook(() =>
				useForm({
					defaultValues: {
						mnemonic: "test mnemonic",
						wallet: {
							address: () => "address",
						},
					},
				}),
			);

			jest.spyOn(electron.remote.dialog, "showSaveDialog").mockImplementation(() => ({
				filePath: undefined,
			}));

			const toastSpy = jest.spyOn(toasts, "success");

			const { getByTestId, asFragment } = render(
				<FormProvider {...form.current}>
					<SecondStep />
				</FormProvider>,
			);

			await act(async () => {
				fireEvent.click(getByTestId(`CreateWallet__download`));
			});

			expect(toastSpy).not.toHaveBeenCalled();
			toastSpy.mockRestore();
		});

		it("should show error toast on error", async () => {
			const { result: form } = renderHook(() =>
				useForm({
					defaultValues: {
						mnemonic: "test mnemonic",
						wallet: {
							address: () => "address",
						},
					},
				}),
			);

			jest.spyOn(electron.remote.dialog, "showSaveDialog").mockImplementation(() => {
				throw new Error("Error");
			});

			const toastSpy = jest.spyOn(toasts, "error");

			const { getByTestId, asFragment } = render(
				<FormProvider {...form.current}>
					<SecondStep />
				</FormProvider>,
			);

			await act(async () => {
				fireEvent.click(getByTestId(`CreateWallet__download`));
			});

			expect(toastSpy).toHaveBeenCalled();
			toastSpy.mockRestore();
		});
	});

	it("should render 3rd step", () => {
		const { result: form } = renderHook(() =>
			useForm({
				defaultValues: {
					mnemonic: "hamster giggle left flush sock appear mule either order solve spirit neutral",
				},
			}),
		);
		const { getByTestId, getAllByTestId } = render(
			<FormProvider {...form.current}>
				<ThirdStep />
			</FormProvider>,
		);

		expect(getByTestId("CreateWallet__third-step")).toBeTruthy();
		expect(getAllByTestId("MnemonicVerificationOptions__button").length).toBeGreaterThan(1);

		expect(form.current.getValues()).toEqual({ verification: undefined });
	});

	it("should render 4th step", async () => {
		const { result: form } = renderHook(() =>
			useForm({
				defaultValues: {
					network: availableNetworksMock[1],
					wallet: {
						address: () => "TEST-WALLET-ADDRESS",
					},
				},
			}),
		);

		const { asFragment, getByTestId, getByText } = render(
			<FormProvider {...form.current}>
				<FourthStep nameMaxLength={42} />
			</FormProvider>,
		);

		expect(getByTestId("CreateWallet__fourth-step")).toBeTruthy();
		expect(asFragment()).toMatchSnapshot();

		expect(getByText("ARK Devnet")).toBeTruthy();
		expect(getByText("TEST-WALLET-ADDRESS")).toBeTruthy();

		const walletNameInput = getByTestId("CreateWallet__wallet-name");

		// Submit
		await act(async () => {
			fireEvent.change(walletNameInput, { target: { value: "Test" } });
		});

		expect(form.current.getValues()).toEqual({ name: "Test" });
	});

	// it("should not allow quick swapping of networks", async () => {
	// 	const history = createMemoryHistory();
	// 	const createURL = `/profiles/${fixtureProfileId}/wallets/create`;
	// 	history.push(createURL);

	// 	const { queryAllByText, getAllByTestId, getByTestId, getByText, asFragment } = renderWithRouter(
	// 		<Route path="/profiles/:profileId/wallets/create">
	// 			<CreateWallet />
	// 		</Route>,
	// 		{
	// 			routes: [createURL],
	// 			history,
	// 		},
	// 	);

	// 	await waitFor(() => expect(getByTestId(`CreateWallet__first-step`)).toBeTruthy());
	// 	expect(asFragment()).toMatchSnapshot();

	// 	const continueButton = getByTestId("CreateWallet__continue-button");
	// 	const networkIcons = getAllByTestId("SelectNetwork__NetworkIcon--container");

	// 	fireEvent.click(networkIcons[1]); // click DARK
	// 	fireEvent.click(networkIcons[0]); // click ARK

	// 	expect(getByTestId("SelectNetworkInput__input")).toHaveAttribute("disabled");
	// 	for (const networkIcon of getAllByTestId("SelectNetwork__NetworkIcon--container")) {
	// 		expect(networkIcon).toHaveAttribute("disabled");
	// 	}
	// 	expect(continueButton).toHaveAttribute("disabled");

	// 	expect(getByTestId("NetworkIcon-ARK-ark.devnet")).toHaveClass("border-theme-success-200");

	// 	await waitFor(() => expect(continueButton).not.toHaveAttribute("disabled"));
	// });

	it("should render", async () => {
		const history = createMemoryHistory();
		const createURL = `/profiles/${fixtureProfileId}/wallets/create`;
		history.push(createURL);

		const { queryAllByText, getByTestId, getByText, asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/create">
				<CreateWallet />
			</Route>,
			{
				routes: [createURL],
				history,
			},
		);

		await waitFor(() => expect(getByTestId("CreateWallet__first-step")).toBeTruthy());
		expect(asFragment()).toMatchSnapshot();

		const selectNetworkInput = getByTestId("SelectNetworkInput__input");
		const continueButton = getByTestId("CreateWallet__continue-button");
		const backButton = getByTestId("CreateWallet__back-button");

		act(() => {
			fireEvent.change(selectNetworkInput, { target: { value: "Ark Dev" } });
			fireEvent.keyDown(selectNetworkInput, { key: "Enter", code: 13 });
		});
		await waitFor(() => expect(continueButton).not.toHaveAttribute("disabled"));

		act(() => {
			fireEvent.change(selectNetworkInput, { target: { value: "" } });
		});
		await waitFor(() => expect(continueButton).toHaveAttribute("disabled"));

		act(() => {
			fireEvent.change(selectNetworkInput, { target: { value: "Ark Dev" } });
			fireEvent.keyDown(selectNetworkInput, { key: "Enter", code: 13 });
		});
		await waitFor(() => expect(continueButton).not.toHaveAttribute("disabled"));
		await waitFor(() => expect(profile.wallets().values().length).toBe(1));

		act(() => {
			fireEvent.click(continueButton);
		});

		await waitFor(() => expect(getByTestId(`CreateWallet__second-step`)).toBeTruthy());

		act(() => {
			fireEvent.click(backButton);
		});

		await waitFor(() => expect(getByTestId(`CreateWallet__first-step`)).toBeTruthy());

		act(() => {
			fireEvent.click(continueButton);
		});

		await waitFor(() => expect(getByTestId(`CreateWallet__second-step`)).toBeTruthy());

		act(() => {
			fireEvent.click(continueButton);
		});

		await waitFor(() => expect(getByTestId(`CreateWallet__third-step`)).toBeTruthy());

		act(() => {
			fireEvent.click(backButton);
		});

		await waitFor(() => expect(getByTestId(`CreateWallet__second-step`)).toBeTruthy());

		act(() => {
			fireEvent.click(continueButton);
		});

		await waitFor(() => expect(getByTestId(`CreateWallet__third-step`)).toBeTruthy());

		const walletMnemonic = passphrase.split(" ");
		for (let i = 0; i < 3; i++) {
			const wordNumber = parseInt(getByText(/Select word #/).innerHTML.replace(/Select word #/, ""));

			await actAsync(async () => {
				fireEvent.click(getByText(walletMnemonic[wordNumber - 1]));
				if (i < 2) {
					await waitFor(() => expect(queryAllByText(/The #([0-9]+) word/).length === 2 - i));
				}
			});
		}
		await waitFor(() => expect(continueButton).not.toHaveAttribute("disabled"));

		act(() => {
			fireEvent.click(continueButton);
		});

		await waitFor(() => expect(getByTestId(`CreateWallet__fourth-step`)).toBeTruthy());

		act(() => {
			fireEvent.click(backButton);
		});

		await waitFor(() => expect(getByTestId(`CreateWallet__third-step`)).toBeTruthy());
		await waitFor(() => expect(continueButton).not.toHaveAttribute("disabled"));

		act(() => {
			fireEvent.click(getByTestId("CreateWallet__continue-button"));
		});

		await waitFor(() => expect(getByTestId(`CreateWallet__fourth-step`)).toBeTruthy());

		const historySpy = jest.spyOn(history, "push");
		act(() => {
			fireEvent.change(getByTestId("CreateWallet__wallet-name"), { target: { value: "Test Wallet" } });
			fireEvent.click(getByTestId(`CreateWallet__save-button`));
		});

		await waitFor(() => expect(historySpy).toHaveBeenCalledWith(`/profiles/${profile?.id()}/dashboard`));
		expect(profile.wallets().values()[0].settings().get(WalletSetting.Alias)).toEqual("Test Wallet");

		expect(asFragment()).toMatchSnapshot();
	});

	it("should not have a pending wallet if leaving on step 1", async () => {
		const history = createMemoryHistory();
		const createURL = `/profiles/${fixtureProfileId}/wallets/create`;
		history.push(createURL);

		const { getByTestId, asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/create">
				<CreateWallet />
			</Route>,
			{
				routes: [createURL, "/"],
				history,
			},
		);
		await waitFor(() => expect(getByTestId("CreateWallet__first-step")).toBeTruthy());

		history.push("/");
		await waitFor(() => expect(profile.wallets().values().length).toBe(0));

		expect(asFragment()).toMatchSnapshot();
	});

	it("should remove pending wallet if not submitted", async () => {
		const history = createMemoryHistory();
		const createURL = `/profiles/${fixtureProfileId}/wallets/create`;
		history.push(createURL);

		const { getByTestId, asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/create">
				<CreateWallet />
			</Route>,
			{
				routes: [createURL, "/"],
				history,
			},
		);
		await waitFor(() => expect(getByTestId("CreateWallet__first-step")).toBeTruthy());

		const selectNetworkInput = getByTestId("SelectNetworkInput__input");
		const continueButton = getByTestId("CreateWallet__continue-button");
		expect(asFragment()).toMatchSnapshot();

		act(() => {
			fireEvent.change(selectNetworkInput, { target: { value: "Ark Dev" } });
			fireEvent.keyDown(selectNetworkInput, { key: "Enter", code: 13 });
		});
		await waitFor(() => expect(continueButton).not.toHaveAttribute("disabled"));

		act(() => {
			fireEvent.click(continueButton);
		});

		await waitFor(() => expect(getByTestId(`CreateWallet__second-step`)).toBeTruthy());

		act(() => {
			fireEvent.click(getByTestId(`CreateWallet__back-button`));
		});

		await waitFor(() => expect(getByTestId(`CreateWallet__first-step`)).toBeTruthy());

		act(() => {
			fireEvent.click(continueButton);
		});

		await waitFor(() => expect(getByTestId(`CreateWallet__second-step`)).toBeTruthy());

		act(() => {
			history.push("/");
		});
		await waitFor(() => expect(profile.wallets().values().length).toBe(0));

		expect(asFragment()).toMatchSnapshot();
	});
});
