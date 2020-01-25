let provider;
let accounts;

document.getElementById("msg").textContent='Please Install Metamask';

ethereum.enable().then(function () {

    provider = new ethers.providers.Web3Provider(web3.currentProvider);

    provider.listAccounts().then(function (result) {
        console.log(result);
        provider.getBalance(String(result[0])).then(function (balance) {
            var etherString = ethers.utils.formatEther(balance);
            console.log("Balance: " + etherString);
            document.getElementById("msg").textContent='ETH Balance: '+etherString;
        });
    })
})