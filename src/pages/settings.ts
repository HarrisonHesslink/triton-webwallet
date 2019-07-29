/*
 * Copyright (c) 2018, Gnock
 * Copyright (c) 2018, The Masari Project
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import {DestructableView} from "../lib/numbersLab/DestructableView";
import {VueVar, VueWatched} from "../lib/numbersLab/VueAnnotate";
import {WalletRepository} from "../model/WalletRepository";
import {DependencyInjectorInstance} from "../lib/numbersLab/DependencyInjector";
import {Wallet} from "../model/Wallet";
import {AppState} from "../model/AppState";
import {Translations} from "../model/Translations";
import {BlockchainExplorerProvider} from "../providers/BlockchainExplorerProvider";
import {BlockchainExplorer} from "../model/blockchain/BlockchainExplorer";
import {WalletWatchdog} from "../model/WalletWatchdog";
import {Mnemonic} from "../model/Mnemonic";

let wallet : Wallet = DependencyInjectorInstance().getInstance(Wallet.name, 'default', false);
let blockchainExplorer : BlockchainExplorer = BlockchainExplorerProvider.getInstance();
let walletWatchdog : WalletWatchdog = DependencyInjectorInstance().getInstance(WalletWatchdog.name,'default', false);

class SendView extends DestructableView{
	@VueVar(10) readSpeed !: number;
	@VueVar(false) checkMinerTx !: boolean;

	@VueVar(0) creationHeight !: number;
	@VueVar(0) scanHeight !: number;

	@VueVar(-1) maxHeight !: number;
	@VueVar('en') language !: string;

	@VueVar(0) nativeVersionCode !: number;
	@VueVar('') nativeVersionNumber !: string;

	@VueVar('') publicAddress: string;
	@VueVar(false) nativePlatform !: boolean;

	constructor(container : string){
		super(container);
		let self = this;
		this.readSpeed = wallet.options.readSpeed;
		this.checkMinerTx = wallet.options.checkMinerTx;

		this.creationHeight = wallet.creationHeight;
		this.scanHeight = wallet.lastHeight;
		this.publicAddress = wallet.getPublicAddress();
		this.nativePlatform = window.native;

		blockchainExplorer.getHeight().then(function (height: number) {
			self.maxHeight = height;
		});

		Translations.getLang().then((userLang : string) => {
			this.language = userLang;
		});

		if(typeof (<any>window).cordova !== 'undefined' && typeof (<any>window).cordova.getAppVersion !== 'undefined') {
			(<any>window).cordova.getAppVersion.getVersionNumber().then((version : string) => {
				this.nativeVersionNumber = version;
			});
			(<any>window).cordova.getAppVersion.getVersionCode().then((version : number) => {
				this.nativeVersionCode = version;
			});
		}
	}

	@VueWatched()
	languageWatch() {
		Translations.setBrowserLang(this.language);
		Translations.loadLangTranslation(this.language);
	}

	deleteWallet() {
		swal({
			title: i18n.t('settingsPage.deleteWalletModal.title'),
			html: i18n.t('settingsPage.deleteWalletModal.content'),
			showCancelButton: true,
			confirmButtonText: i18n.t('global.openWalletModal.confirmText'),
			cancelButtonText: i18n.t('global.openWalletModal.cancelText'),
		}).then((result:any) => {
			if (result.value) {
				AppState.disconnect();
				DependencyInjectorInstance().register(Wallet.name, undefined,'default');
				WalletRepository.deleteLocalCopy();
				window.location.href = '#index';
			}
		});
	}

	@VueWatched()	readSpeedWatch(){this.updateWalletOptions();}
	@VueWatched()	checkMinerTxWatch(){this.updateWalletOptions();}
	@VueWatched()	creationHeightWatch(){
		if(this.creationHeight < 0)this.creationHeight = 0;
		if(this.creationHeight > this.maxHeight && this.maxHeight !== -1)this.creationHeight = this.maxHeight;
	}
	@VueWatched()	scanHeightWatch(){
		if(this.scanHeight < 0)this.scanHeight = 0;
		if(this.scanHeight > this.maxHeight && this.maxHeight !== -1)this.scanHeight = this.maxHeight;
	}

	private updateWalletOptions(){
		let options = wallet.options;
		options.readSpeed = this.readSpeed;
		options.checkMinerTx = this.checkMinerTx;
		wallet.options = options;
		walletWatchdog.signalWalletUpdate();
	}

	updateWalletSettings(){
		wallet.creationHeight = this.creationHeight;
		wallet.lastHeight = this.scanHeight;
		walletWatchdog.signalWalletUpdate();
	}
askUserPassword(): Promise<{ wallet: Wallet, password: string } | null> {
		return swal({
			input: 'password',
			showCancelButton: true,
			title: i18n.t('global.openWalletModal.title'),
			confirmButtonText: i18n.t('exportPage.mnemonicLangSelectionModal.confirmText'),
			cancelButtonText: i18n.t('exportPage.mnemonicKeyModal.confirmText'),
		}).then((result: any) => {
			if (result.value) {
				let savePassword : string = result.value;
				// let password = prompt();
				// let wallet = WalletRepository.getMain();
				return WalletRepository.getLocalWalletWithPassword(savePassword).then((wallet : Wallet|null) : { wallet: Wallet, password: string }|null => {
					if (wallet !== null) {
						return {wallet: wallet, password: savePassword};
					} else {
						swal({
							type: 'error',
							title: i18n.t('global.invalidPasswordModal.title'),
							text: i18n.t('global.invalidPasswordModal.content'),
							confirmButtonText: i18n.t('global.invalidPasswordModal.confirmText'),
						});
					}
					return null;
				});
			}
			return null;
		});
	}

	getPrivateKeys() {
		this.askUserPassword().then(function (params: { wallet: Wallet, password: string } | null) {
			if (params !== null && params.wallet !== null) {
				swal({
					title: i18n.t('exportPage.walletKeysModal.title'),
					confirmButtonText: i18n.t('exportPage.walletKeysModal.confirmText'),
					html: i18n.t('exportPage.walletKeysModal.content', {
						privViewKey: params.wallet.keys.priv.view,
						privSpendKey: params.wallet.keys.priv.spend
					}),
				});
			}
		});
	}

	getMnemonicPhrase() {
		this.askUserPassword().then(function (params: { wallet: Wallet, password: string } | null) {
			if (params !== null && params.wallet !== null) {
				swal({
					title: i18n.t('exportPage.mnemonicLangSelectionModal.title'),
					input: 'select',
					showCancelButton: true,
					confirmButtonText: i18n.t('exportPage.mnemonicLangSelectionModal.confirmText'),
					inputOptions: {
						'english': 'English',
						'chinese': 'Chinese (simplified)',
						'dutch': 'Dutch',
						'electrum': 'Electrum',
						'esperanto': 'Esperanto',
						'french': 'French',
						'italian': 'Italian',
						'japanese': 'Japanese',
						'lojban': 'Lojban',
						'portuguese': 'Portuguese',
						'russian': 'Russian',
						'spanish': 'Spanish',
					}
				}).then((mnemonicLangResult: {value?:string}) => {
					if(mnemonicLangResult.value) {
						let mnemonic = Mnemonic.mn_encode(params.wallet.keys.priv.spend, mnemonicLangResult.value);
						swal({
							title: i18n.t('exportPage.mnemonicKeyModal.title'),
							confirmButtonText: i18n.t('exportPage.mnemonicKeyModal.confirmText'),
							html: i18n.t('exportPage.mnemonicKeyModal.content', {
								mnemonic: mnemonic,
							}),
						});
					}
				});
			}
		});
	}

	fileExport() {
		this.askUserPassword().then(function (params: { wallet: Wallet, password: string } | null) {
			if (params !== null && params.wallet !== null) {
				let blob = new Blob([JSON.stringify(WalletRepository.getEncrypted(params.wallet, params.password))], {type: "application/json"});
				saveAs(blob, "wallet.json");
			}
		});
	}

	exportEncryptedPdf() {
		this.askUserPassword().then(function (params: { wallet: Wallet, password: string } | null) {
			if (params !== null && params.wallet !== null) {
				WalletRepository.downloadEncryptedPdf(params.wallet);
			}
		});
	}

}


if(wallet !== null && blockchainExplorer !== null)
	new SendView('#app');
else
	window.location.href = '#index';
