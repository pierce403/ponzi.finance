let provider;
let accounts;

ethereum.enable();

if (typeof web3 !== 'undefined') {
    provider = new ethers.providers.Web3Provider(web3.currentProvider);

    provider.listAccounts().then(function (result) {
        console.log(result);
        provider.getBalance(String(result[0])).then(function (balance) {
            var etherString = ethers.utils.formatEther(balance);
            console.log("Balance: " + etherString);
        });
    })
}