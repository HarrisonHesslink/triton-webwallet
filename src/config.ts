let global : any = typeof window !== 'undefined' ? window : self;
global.config = {
	apiUrl:typeof window !== 'undefined' && window.location ? window.location.href.substr(0,window.location.href.lastIndexOf('/')+1)+'api/' : 'http://localhost/api/',
	trustedDaemonsAddresses:[
		'http://wallet.equilibria.network:8080/'
	],
	phpRelay:typeof window !== 'undefined' ? true : false,
	mainnetExplorerUrl: "https://explorer.xtri.network",
    mainnetExplorerUrlHash: "https://explorer.xtri.network/tx/{ID}",
    mainnetExplorerUrlBlock: "https://explorer.xtri.network/block/{ID}",
	testnetExplorerUrl: "http://testnet.msrchain.net/",
	testnetExplorerUrlHash: "http://testnet.msrchain.net/tx/{ID}",
	testnetExplorerUrlBlock: "http://testnet.msrchain.net/block/{ID}",
	testnet: false,
	coinUnitPlaces: 4,
	txMinConfirms: 10,         // corresponds to CRYPTONOTE_DEFAULT_TX_SPENDABLE_AGE in Monero
	txCoinbaseMinConfirms: 60, // corresponds to CRYPTONOTE_MINED_MONEY_UNLOCK_WINDOW in Monero
	addressPrefix: 289,
    integratedAddressPrefix: 0x629f,
	addressPrefixTestnet: 33,
	integratedAddressPrefixTestnet: 34,
	subAddressPrefix: 52,
	subAddressPrefixTestnet: 73,
	feePerKB: new JSBigInt('400000000'),//20^10 - for testnet its not used, as fee is dynamic.
	dustThreshold: new JSBigInt('1000000000'),//10^10 used for choosing outputs/change - we decompose all the way down if the receiver wants now regardless of threshold
	defaultMixin: 12, // default value mixin

	idleTimeout: 30,
	idleWarningDuration: 20,

	coinSymbol: 'XEQ',
    openAliasPrefix: "xeq",
    coinName: 'Equilibria',
    coinUriPrefix: 'equa:',
    avgBlockTime: 180,
	maxBlockNumber: 500000000,

	donationAddresses : [

	]
};
