let provider;
let accounts;

//let contractAddress = "0x0D6c3b9599eccF54819DB6B768B4B77eF3c932A9";
//let contractAddress = "0x167662223C0755eA4310a5E6Cacba557Bfb951a2";
//let contractAddress = "0x8416c1863eDEea0E0f0f766CfF1b1800Fdb749aD";
let contractAddress = "0xEB82AE50FA5b15FFc2699143b3da1B524127853B";

let contract = "";
let accountAddress = "";
let signer;

let abi = [
    "function getBalance() public view returns(uint256 value)",
    "function getLogCount() public view returns (uint256)",
    "function getWealth() public view returns (uint256)",
    "function getWealthAtTime(uint256) public view returns (uint256)",
    "function playerLog(uint256) public view returns (address, uint256, uint256, uint256, uint256)",
    "function players(address) public view returns (uint256, uint256, uint256)",
    "function getAge() public view returns (uint256)",
    "function bumpComp(uint256 count) public returns (uint256)",
    "function compTable(uint256 count) public returns (uint256)",
    "function withdraw() public returns(bool result)"
];

document.getElementById("msg").textContent = 'Please Install Metamask';

ethereum.enable().then(function () {

    provider = new ethers.providers.Web3Provider(web3.currentProvider);

    provider.listAccounts().then(function (result) {
        console.log(result);
        accountAddress = result[0];
        provider.getBalance(String(result[0])).then(function (balance) {
            var etherString = ethers.utils.formatEther(balance);
            console.log("Balance: " + etherString);
            document.getElementById("msg").textContent = 'ETH Balance: ' + etherString;
        });

        signer = provider.getSigner();

        populateTable();
    })
})

function populateTable() {
    console.log("populating table");

    contract = new ethers.Contract(contractAddress, abi, signer);

    contract.getBalance().then(function (value) {
        console.log("Pool Balance: " + value);
        document.getElementById("marketSize").innerText = value / ethers.constants.WeiPerEther + " ETH";
    })

    contract.players(accountAddress).then(function (value) {
        console.log("Deposit: " + value[1]);
        //document.getElementById("deposit").innerText=value[1]/ethers.constants.WeiPerEther+" ETH";
        refreshButton(value[1]);
    })

    playerTable = document.getElementById("playerTable");

    contract.getLogCount().then(function (logSize) {
        console.log("looks like " + logSize + " log entries");

        for (let x = 0; x < logSize; ++x) {

            let row = playerTable.insertRow(-1);
            row.insertCell().innerText = x;

            contract.playerLog(x).then(function (value) {
                console.log("address is " + value[0]);
                row.insertCell().innerText = value[0];

                console.log("deposit is " + value[1]);
                row.insertCell().innerText = (value[1] / ethers.constants.WeiPerEther) + " ETH";

                console.log("regtime is " + value[2]);
                row.insertCell().innerText = value[2];

                if (value[3] == 0) {
                    if (value[4] == 0) {
                        row.insertCell().innerText = "HOPEFUL"
                    } else {
                        row.insertCell().innerText = "REKT :-("
                    }
                } else {
                    let percentGainz = (value[3] / value[1] * 100 - 100).toFixed(2);
                    row.insertCell().innerText = "WON (+" + percentGainz + "%)";
                }
            })
        }
    });
}

function refreshButton(deposit) {
    if (deposit == 0) { // if the user has no money, show Deposit UX
        document.getElementById("bigRedButton").innerText = "Deposit ETH";
        document.getElementById("bigRedButton").onclick = function () {
            console.log("WOAW DEPOSIT");
            let depositValue = ethers.utils.parseEther(document.getElementById("depositInput").value);
            console.log("Depositing "+depositValue+" ETH");
            console.log("From "+accountAddress);
            let tx = {
                to: contractAddress,
                value: depositValue
            };
            //signer.send('eth_sendTransaction', tx);
            signer.sendTransaction(tx); 
        }
        document.getElementById("winnings").innerHTML="<div class=\"input-group input-group-sm mb-3 col-5\">\r\n  <input id=\"depositInput\" width=200 value=\"0.1\" type=\"text\" class=\"form-control\" aria-label=\"Small\" aria-describedby=\"inputGroup-sizing-sm\">\r\n<\/div>";

    } else { // if the user has money in the game, show Withdrawl UX
        document.getElementById("bigRedButton").innerText = "Withdraw ETH";
        document.getElementById("bigRedButton").onclick = function () {
            contract.withdraw().then(function (value) {
                if (value) {
                    console.log("Withdraw Successful");
                } else {
                    console.log("Oh No Withdraw Failure :-(");
                }
            })
        }
        contract.getWealth().then(function (value) {
            let percentGainz = (value / deposit * 100 - 100).toFixed(2);
            document.getElementById("winnings").innerText = value / ethers.constants.WeiPerEther + " ETH (+" + percentGainz + "%)";
        })

    }
}

function potato() {

}

function bigRedButtonClick() {
    console.log("nice");
}